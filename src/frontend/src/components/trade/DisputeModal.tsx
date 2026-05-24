import type {
  DisputeEvidencePack,
  DisputeId,
  MediaAttachment,
  TradeId,
} from "@/backend.d";
import { DisputeReason } from "@/backend.d";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
      value: DisputeReason.item_damaged,
      uiKey: "item_damaged",
      labelKey: "dispute.reason.itemDamaged",
    },
    {
      value: DisputeReason.other,
      uiKey: "other",
      labelKey: "dispute.reason.other",
    },
  ];

const MAX_EVIDENCE = 5;
const MAX_DESC = 1000;
const MIN_PHOTOS = 2;
const ACCEPTED_TYPES = "image/*,video/*,.pdf,.doc,.docx";

type EvidenceStatus = "uploading" | "done" | "error";

interface EvidenceFile {
  id: number;
  file: File;
  progress: number;
  status: EvidenceStatus;
  attachment?: MediaAttachment;
  previewUrl?: string;
  errorMessage?: string;
  role?: "ttn" | "package";
}

interface DisputeModalProps {
  open: boolean;
  onClose: () => void;
  tradeId: TradeId;
  tradeKind: "physical" | "digital";
  digitalFileHash?: string | null;
  downloadTimestamp?: bigint | null;
}

export function DisputeModal({
  open,
  onClose,
  tradeId,
  tradeKind,
  digitalFileHash,
  downloadTimestamp,
}: DisputeModalProps) {
  const { actor } = useBackend();
  const { identity } = useAuth();
  const { uploadFile } = useUploadFile(identity);
  const { t: tl } = useLocale();
  const qc = useQueryClient();

  const isPhysical = tradeKind === "physical";

  const [reason, setReason] = useState<string>(REASON_KEYS[0].uiKey);
  const [description, setDescription] = useState("");
  const [chatThreadLink, setChatThreadLink] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const nextId = useRef(0);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const uploadRoleRef = useRef<"ttn" | "package">("package");

  const packagePhotoCount = useMemo(
    () =>
      evidenceFiles.filter(
        (e) => e.status === "done" && (e.role === "package" || !e.role),
      ).length,
    [evidenceFiles],
  );

  const ttnScreenshotUrl = useMemo(() => {
    const ttn = evidenceFiles.find(
      (e) => e.role === "ttn" && e.status === "done",
    );
    return ttn?.attachment?.url ?? null;
  }, [evidenceFiles]);

  const handleFiles = useCallback(
    (files: FileList | File[], role: "ttn" | "package" = "package") => {
      const fileArray = Array.from(files);
      const remaining = MAX_EVIDENCE - evidenceFiles.length;
      if (remaining <= 0) {
        toast.warning(tl("dispute.evidence.maxFiles"));
        return;
      }
      const toUpload = fileArray.slice(0, remaining);

      for (const file of toUpload) {
        const id = nextId.current++;
        const previewUrl = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;

        setEvidenceFiles((prev) => [
          ...prev,
          { id, file, progress: 0, status: "uploading", previewUrl, role },
        ]);

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
          });
      }
    },
    [evidenceFiles.length, uploadFile, tl],
  );

  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];
    if (description.trim().length < 20) {
      errors.push(tl("dispute.validation.descriptionMin"));
    }
    if (isPhysical) {
      if (!ttnScreenshotUrl) errors.push(tl("dispute.validation.ttnRequired"));
      if (packagePhotoCount < MIN_PHOTOS) {
        errors.push(tl("dispute.validation.photosMin"));
      }
      if (!chatThreadLink.trim()) {
        errors.push(tl("dispute.validation.chatLinkRequired"));
      }
    } else {
      if (!digitalFileHash) errors.push(tl("dispute.validation.hashRequired"));
      if (downloadTimestamp == null) {
        errors.push(tl("dispute.validation.downloadTsRequired"));
      }
    }
    return errors;
  }, [
    chatThreadLink,
    description,
    digitalFileHash,
    downloadTimestamp,
    isPhysical,
    packagePhotoCount,
    tl,
    ttnScreenshotUrl,
  ]);

  const buildEvidencePack = useCallback((): DisputeEvidencePack => {
    const photoUrls = evidenceFiles
      .filter((e) => e.status === "done" && e.role !== "ttn" && e.attachment)
      .map((e) => e.attachment!.url);

    if (isPhysical) {
      return {
        ttnScreenshotUrl: ttnScreenshotUrl || undefined,
        packagePhotoUrls: photoUrls,
        chatThreadLink: chatThreadLink.trim() || undefined,
        fileHash: undefined,
        downloadTimestamp: 0n,
      };
    }
    return {
      ttnScreenshotUrl: undefined,
      packagePhotoUrls: [],
      chatThreadLink: undefined,
      fileHash: digitalFileHash ?? undefined,
      downloadTimestamp: downloadTimestamp ?? 0n,
    };
  }, [
    chatThreadLink,
    digitalFileHash,
    downloadTimestamp,
    evidenceFiles,
    isPhysical,
    ttnScreenshotUrl,
  ]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const errors = validateForm();
      if (errors.length > 0) {
        setValidationErrors(errors);
        throw new Error("validation");
      }
      setValidationErrors([]);

      const backendReason =
        REASON_KEYS.find((r) => r.uiKey === reason)?.value ??
        DisputeReason.other;

      const res = await actor!.openDispute(
        tradeId,
        backendReason,
        description.trim(),
        buildEvidencePack(),
      );
      if (
        handleResultError(
          res as { __kind__?: string; err?: Record<string, unknown> },
        )
      ) {
        throw new Error("handled");
      }
      if (!("ok" in res)) throw new Error("Unexpected response");
      return (res as { ok: DisputeId }).ok;
    },
    onSuccess: () => {
      toast.success(tl("dispute.openedMessage"));
      qc.invalidateQueries({ queryKey: ["trade", tradeId.toString()] });
      onClose();
    },
    onError: (e) => {
      if ((e as Error).message === "validation") return;
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
            {isPhysical
              ? tl("dispute.playbook.physicalHint")
              : tl("dispute.playbook.digitalHint")}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {validationErrors.length > 0 && (
            <ul
              className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive space-y-1"
              data-ocid="dispute-validation-errors"
            >
              {validationErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}

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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="dispute-desc">
                {tl("dispute.form.description")}
              </Label>
              <span className="text-xs text-muted-foreground">
                {description.length}/{MAX_DESC}
              </span>
            </div>
            <Textarea
              id="dispute-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={4}
              maxLength={MAX_DESC}
              data-ocid="dispute-description"
            />
          </div>

          {isPhysical ? (
            <>
              <div className="space-y-2">
                <Label>{tl("dispute.evidence.ttn")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    uploadRoleRef.current = "ttn";
                    evidenceInputRef.current?.click();
                  }}
                >
                  {tl("dispute.evidence.uploadTtn")}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dispute-chat-link">
                  {tl("dispute.evidence.chatLink")}
                </Label>
                <Input
                  id="dispute-chat-link"
                  value={chatThreadLink}
                  onChange={(e) => setChatThreadLink(e.target.value)}
                  placeholder="https://…"
                  data-ocid="dispute-chat-link"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {tl("dispute.evidence.packagePhotos")} ({packagePhotoCount}/
                  {MIN_PHOTOS}+)
                </Label>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">
                  {tl("dispute.evidence.fileHash")}:{" "}
                </span>
                <span className="font-mono text-xs break-all">
                  {digitalFileHash ?? "—"}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                {tl("dispute.playbook.digitalInspectionNote")}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <input
              ref={evidenceInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="sr-only"
              data-ocid="dispute-evidence-input"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files, uploadRoleRef.current);
                  e.target.value = "";
                }
              }}
            />
            {isPhysical && evidenceFiles.length < MAX_EVIDENCE && (
              <button
                type="button"
                data-ocid="dispute-evidence-dropzone"
                className={[
                  "w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors text-left",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                ].join(" ")}
                onClick={() => {
                  uploadRoleRef.current = "package";
                  evidenceInputRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  uploadRoleRef.current = "package";
                  if (e.dataTransfer.files.length > 0) {
                    handleFiles(e.dataTransfer.files, "package");
                  }
                }}
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  {tl("dispute.evidence.dropHint")}
                </p>
              </button>
            )}

            {evidenceFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {evidenceFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-2"
                  >
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.role === "ttn"
                          ? tl("dispute.evidence.ttn")
                          : item.file.name}
                      </p>
                      {item.status === "uploading" && (
                        <Progress
                          value={item.progress}
                          className="h-1.5 mt-1"
                        />
                      )}
                    </div>
                    {!isPending && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          setEvidenceFiles((prev) =>
                            prev.filter((e) => e.id !== item.id),
                          )
                        }
                      >
                        <X className="w-3.5 h-3.5" />
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
            {isPending ? tl("jurors.submitting") : tl("dispute.form.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
