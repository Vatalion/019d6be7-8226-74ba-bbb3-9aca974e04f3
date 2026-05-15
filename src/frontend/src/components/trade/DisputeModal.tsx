import type { DisputeId, MediaAttachment, TradeId } from "@/backend.d";
import { DisputeReason } from "@/backend.d";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/hooks/useBackend";
import { useUploadFile } from "@/hooks/useBackend";
import { useLocale } from "@/hooks/useLocale";
import { handleResultError } from "@/utils/errorHandler";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  File as FileIcon,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Constants ─────────────────────────────────────────────────────────────

// UI labels are mapped to valid backend DisputeReason values.
// "not_shipped" → item_not_received (closest backend equivalent)
// "payment_issue" → other (no dedicated backend value)
const REASON_KEYS: { value: DisputeReason; uiKey: string; labelKey: string }[] =
  [
    {
      value: DisputeReason.item_differs,
      uiKey: "item_differs",
      labelKey: "dispute.reason.itemDiffers",
    },
    {
      value: DisputeReason.item_not_received,
      uiKey: "not_shipped",
      labelKey: "dispute.reason.notShipped",
    },
    {
      value: DisputeReason.other,
      uiKey: "payment_issue",
      labelKey: "dispute.reason.payment",
    },
    {
      value: DisputeReason.other,
      uiKey: "other",
      labelKey: "dispute.reason.other",
    },
  ];

const MAX_EVIDENCE = 5;
const MAX_DESC = 1000;
const ACCEPTED_TYPES = "image/*,video/*,.pdf,.doc,.docx";

// ─── Types ──────────────────────────────────────────────────────────────────

type EvidenceStatus = "uploading" | "done" | "error";

interface EvidenceFile {
  id: number;
  file: File;
  progress: number;
  status: EvidenceStatus;
  attachment?: MediaAttachment;
  previewUrl?: string;
  errorMessage?: string;
}

interface DisputeModalProps {
  open: boolean;
  onClose: () => void;
  tradeId: TradeId;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DisputeModal({ open, onClose, tradeId }: DisputeModalProps) {
  const { actor } = useBackend();
  const { identity } = useAuth();
  const { uploadFile } = useUploadFile(identity);
  const { t: tl } = useLocale();
  const qc = useQueryClient();

  const [reason, setReason] = useState<string>(REASON_KEYS[0].uiKey);
  const [description, setDescription] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const nextId = useRef(0);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  // ── Upload handler ────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = MAX_EVIDENCE - evidenceFiles.length;
      if (remaining <= 0) {
        toast.warning(`Maximum ${MAX_EVIDENCE} evidence files allowed`);
        return;
      }
      const toUpload = fileArray.slice(0, remaining);

      for (const file of toUpload) {
        const id = nextId.current++;
        const previewUrl = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;

        // Add placeholder entry immediately
        setEvidenceFiles((prev) => [
          ...prev,
          { id, file, progress: 0, status: "uploading", previewUrl },
        ]);

        // Start upload
        uploadFile(file, (pct) => {
          setEvidenceFiles((prev) =>
            prev.map((e) => (e.id === id ? { ...e, progress: pct } : e)),
          );
        })
          .then((url) => {
            const attachment: MediaAttachment = {
              url,
              mimeType: file.type || "application/octet-stream",
              fileName: file.name,
              fileSize: BigInt(file.size),
            };
            setEvidenceFiles((prev) =>
              prev.map((e) =>
                e.id === id
                  ? { ...e, progress: 100, status: "done", attachment }
                  : e,
              ),
            );
          })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : "Upload failed";
            setEvidenceFiles((prev) =>
              prev.map((e) =>
                e.id === id ? { ...e, status: "error", errorMessage: msg } : e,
              ),
            );
            toast.error(`Failed to upload evidence: ${msg}`);
          });
      }
    },
    [evidenceFiles.length, uploadFile],
  );

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const removeEvidence = useCallback((id: number) => {
    setEvidenceFiles((prev) => {
      const item = prev.find((e) => e.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // Resolve backend DisputeReason from UI key
      const backendReason =
        REASON_KEYS.find((r) => r.uiKey === reason)?.value ??
        DisputeReason.other;
      // Step 1 — open the dispute
      const res = await actor!.openDispute(
        tradeId,
        backendReason,
        description.trim(),
      );
      if (
        handleResultError(
          res as { __kind__?: string; err?: Record<string, unknown> },
        )
      ) {
        throw new Error("handled");
      }

      if (!("ok" in res)) throw new Error("Unexpected response");
      const disputeId = (res as { ok: DisputeId }).ok;

      // Step 2 — attach evidence files (best-effort)
      const readyAttachments = evidenceFiles
        .filter((e) => e.status === "done" && e.attachment)
        .map((e) => e.attachment!);

      if (readyAttachments.length > 0 && actor) {
        try {
          await actor.addEvidence(disputeId, readyAttachments);
        } catch (evidenceErr) {
          // Evidence failure should NOT block dispute creation
          console.error("[DisputeModal] addEvidence failed:", evidenceErr);
          toast.warning(
            "Dispute opened, but some evidence files could not be attached.",
          );
        }
      }
    },
    onSuccess: () => {
      toast.success(tl("dispute.openedMessage"));
      qc.invalidateQueries({ queryKey: ["trade", tradeId.toString()] });
      onClose();
    },
    onError: (e) => {
      if ((e as Error).message === "handled") return;
      toast.error(`Failed to open dispute: ${(e as Error).message}`);
    },
  });

  const hasUploading = evidenceFiles.some((e) => e.status === "uploading");

  const canSubmit =
    description.trim().length >= 20 &&
    description.length <= MAX_DESC &&
    !isPending &&
    !hasUploading &&
    !!actor;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      data-ocid="dispute-modal"
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <DialogTitle>{tl("dispute.form.title")}</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {tl("dispute.openedMessage")}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="dispute-reason">{tl("dispute.form.reason")}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v)}>
              <SelectTrigger
                id="dispute-reason"
                data-ocid="dispute-reason-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASON_KEYS.map((r) => (
                  <SelectItem key={r.uiKey} value={r.uiKey}>
                    {tl(r.labelKey as Parameters<typeof tl>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="dispute-desc">
                {tl("dispute.form.description")}
              </Label>
              <span
                className={
                  description.length > MAX_DESC
                    ? "text-xs text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {description.length}/{MAX_DESC}
              </span>
            </div>
            <Textarea
              id="dispute-desc"
              placeholder="Describe what happened in detail (min. 20 characters)…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={4}
              maxLength={MAX_DESC}
              data-ocid="dispute-description"
            />
          </div>

          {/* Evidence Upload */}
          <div className="space-y-2">
            <Label>Evidence Files</Label>
            <p className="text-xs text-muted-foreground">
              Upload up to {MAX_EVIDENCE} photos, videos, or documents as
              evidence
            </p>

            {/* Hidden file input */}
            <input
              ref={evidenceInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="sr-only"
              data-ocid="dispute-evidence-input"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />

            {/* Drop zone */}
            {evidenceFiles.length < MAX_EVIDENCE && (
              <button
                type="button"
                data-ocid="dispute-evidence-dropzone"
                className={[
                  "w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors text-left",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                ].join(" ")}
                onClick={() => evidenceInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                aria-label="Upload evidence files"
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Drop evidence files here or{" "}
                  <span className="text-primary font-medium">
                    click to select
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Images, videos, PDF, DOC • max 25 MB each
                </p>
              </button>
            )}

            {/* Evidence preview list */}
            {evidenceFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {evidenceFiles.map((item) => (
                  <div
                    key={item.id}
                    data-ocid="dispute-evidence-item"
                    className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-2"
                  >
                    {/* Thumbnail or icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : item.file.type.startsWith("image/") ? (
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <FileIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info + progress */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(item.file.size)}
                      </p>
                      {item.status === "uploading" && (
                        <div className="mt-1.5">
                          <Progress value={item.progress} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.progress}%
                          </p>
                        </div>
                      )}
                      {item.status === "done" && (
                        <p className="text-xs text-green-600 mt-1">
                          Uploaded ✓
                        </p>
                      )}
                      {item.status === "error" && (
                        <p className="text-xs text-destructive mt-1 truncate">
                          {item.errorMessage ?? "Upload failed"}
                        </p>
                      )}
                    </div>

                    {/* Remove button */}
                    {!isPending && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 h-7 w-7"
                        onClick={() => removeEvidence(item.id)}
                        aria-label="Remove evidence file"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-ocid="dispute-cancel-btn"
          >
            {tl("detail.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit}
            onClick={() => mutate()}
            data-ocid="dispute-submit-btn"
          >
            {isPending
              ? tl("jurors.submitting")
              : hasUploading
                ? tl("chat.uploading")
                : tl("dispute.form.title")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
