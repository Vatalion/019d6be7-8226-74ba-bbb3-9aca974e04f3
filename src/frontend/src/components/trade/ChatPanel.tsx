import type { MediaAttachment, TradeId } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend, useUploadFile } from "@/hooks/useBackend";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { handleResultError } from "@/utils/errorHandler";
import type { Identity } from "@icp-sdk/core/agent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "../../hooks/useLocale";
import { MessageBubble } from "./MessageBubble";

interface PendingFile {
  id: number;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  attachment?: MediaAttachment;
  previewUrl?: string;
}

interface ChatPanelProps {
  tradeId: TradeId;
  myPrincipal: string;
  unreadCount?: number;
  identity?: Identity;
}

let _pendingIdCounter = 0;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatPanel({
  tradeId,
  myPrincipal,
  unreadCount = 0,
  identity,
}: ChatPanelProps) {
  const { actor, isFetching } = useBackend();
  const { t } = useLocale();
  const qc = useQueryClient();
  const { uploadFile } = useUploadFile(identity);
  const { isVisible, justBecameVisible } = useVisiblePolling();

  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  // ── Messages query ──────────────────────────────────────────────────────
  const {
    data: messages = [],
    isLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["tradeMessages", tradeId.toString()],
    queryFn: () => actor!.getTradeMessages(tradeId, 0n, 100n),
    enabled: !!actor && !isFetching,
    refetchInterval: isVisible ? 15_000 : false,
  });

  // Catch up on missed messages when tab becomes visible after > 30s hidden
  useEffect(() => {
    if (justBecameVisible) {
      void refetchMessages();
    }
  }, [justBecameVisible, refetchMessages]);

  // Mark as read on mount
  useEffect(() => {
    if (actor && !isFetching) {
      actor.markTradeAsRead(tradeId).catch(() => {});
    }
  }, [actor, isFetching, tradeId]);

  // Scroll to bottom on new messages
  const msgCount = messages.length;
  const prevCountRef = useRef(0);
  if (msgCount !== prevCountRef.current) {
    prevCountRef.current = msgCount;
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  // ── Upload handler ──────────────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const currentCount = pendingFiles.filter(
        (f) => f.status !== "error",
      ).length;
      const canAdd = 10 - currentCount;
      if (canAdd <= 0) {
        toast.error(t("chat.attachments.max"));
        return;
      }
      const toUpload = fileArray.slice(0, canAdd);

      const newEntries: PendingFile[] = toUpload.map((file) => {
        const id = ++_pendingIdCounter;
        const previewUrl = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;
        return { id, file, progress: 0, status: "uploading", previewUrl };
      });

      setPendingFiles((prev) => [...prev, ...newEntries]);

      for (const entry of newEntries) {
        try {
          const url = await uploadFile(entry.file, (pct) => {
            setPendingFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id ? { ...f, progress: pct } : f,
              ),
            );
          });
          const attachment: MediaAttachment = {
            url,
            mimeType: entry.file.type || "application/octet-stream",
            fileName: entry.file.name,
            fileSize: BigInt(entry.file.size),
          };
          setPendingFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: "done", progress: 100, attachment }
                : f,
            ),
          );
        } catch {
          setPendingFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, status: "error", progress: 0 } : f,
            ),
          );
          toast.error(t("create.error.uploadFailed"));
        }
      }
    },
    [pendingFiles, uploadFile, t],
  );

  // ── Drag-and-drop ────────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        void uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles],
  );

  // ── File input change ────────────────────────────────────────────────────
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void uploadFiles(e.target.files);
      }
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [uploadFiles],
  );

  // ── Remove pending file ──────────────────────────────────────────────────
  const removePending = useCallback((id: number) => {
    setPendingFiles((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const readyAttachments: MediaAttachment[] = pendingFiles
    .filter((f) => f.status === "done" && f.attachment)
    .map((f) => f.attachment!);

  const { mutate: sendMsg, isPending } = useMutation({
    mutationFn: () =>
      actor!.sendMessage(tradeId, text.trim(), readyAttachments),
    onSuccess: (res) => {
      if (
        handleResultError(
          res as { __kind__?: string; err?: Record<string, unknown> },
        )
      ) {
        return;
      }
      // Revoke all preview URLs
      for (const f of pendingFiles) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      }
      setText("");
      setPendingFiles([]);
      qc.invalidateQueries({ queryKey: ["tradeMessages", tradeId.toString()] });
    },
    onError: () => toast.error(t("chat.sendError")),
  });

  const hasUploading = pendingFiles.some((f) => f.status === "uploading");
  const canSend =
    (text.trim().length > 0 || readyAttachments.length > 0) &&
    !isPending &&
    !hasUploading &&
    !!actor;

  const atLimit = pendingFiles.filter((f) => f.status !== "error").length >= 10;

  return (
    <div
      className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden relative"
      data-ocid="chat-panel"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Paperclip className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-primary">
              {t("chat.dropOverlay")}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <h3 className="font-semibold text-sm text-foreground">
          {t("chat.title")}
        </h3>
        {unreadCount > 0 && (
          <span
            className="status-badge-funded text-xs"
            data-ocid="chat-unread-badge"
          >
            {t("chat.unread").replace("{count}", String(unreadCount))}
          </span>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}
              >
                <Skeleton className="h-10 w-40 sm:w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-32 text-center"
            data-ocid="chat-empty"
          >
            <span className="text-3xl mb-2">💬</span>
            <p className="text-xs text-muted-foreground">{t("chat.empty")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id.toString()}
                message={msg}
                isOwn={msg.sender.toString() === myPrincipal}
                senderName={msg.sender.toString().slice(0, 8)}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Pending attachments preview */}
      {pendingFiles.length > 0 && (
        <div className="px-3 py-1.5 sm:px-4 sm:py-2 border-t border-border flex-shrink-0">
          <div
            className="flex flex-wrap gap-1.5 sm:gap-2"
            data-ocid="chat-pending-attachments"
          >
            {pendingFiles.map((entry) => (
              <div
                key={entry.id}
                className="relative"
                data-ocid={`chat-pending-attachment.${entry.id}`}
              >
                {entry.file.type.startsWith("image/") && entry.previewUrl ? (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-border relative">
                    <img
                      src={entry.previewUrl}
                      alt={entry.file.name}
                      className="w-full h-full object-cover"
                    />
                    {entry.status === "uploading" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                    )}
                    {entry.status === "error" && (
                      <div className="absolute inset-0 bg-destructive/60 flex items-center justify-center">
                        <span className="text-white text-[10px]">✕</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-muted/40 min-w-0 max-w-[100px] sm:max-w-[120px]">
                    <Paperclip className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-foreground truncate">
                        {entry.file.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.status === "uploading"
                          ? `${entry.progress}%`
                          : formatFileSize(entry.file.size)}
                      </p>
                    </div>
                    {entry.status === "uploading" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border rounded">
                        <div
                          className="h-full bg-primary transition-all rounded"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  onClick={() => removePending(entry.id)}
                  aria-label={t("chat.removeAttachment")}
                  data-ocid={`chat-remove-attachment.${entry.id}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        multiple
        className="hidden"
        onChange={handleFileChange}
        data-ocid="chat-file-input"
      />

      {/* Send form */}
      <div className="px-2.5 py-2 sm:px-4 sm:py-3 border-t border-border flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8 p-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={atLimit}
          aria-label={t("chat.attachment.ariaLabel")}
          data-ocid="chat-attach-btn"
          title={atLimit ? t("chat.attachments.max") : undefined}
        >
          <Paperclip
            className={`w-4 h-4 ${atLimit ? "text-muted-foreground/40" : pendingFiles.length > 0 ? "text-primary" : "text-muted-foreground"}`}
          />
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("chat.placeholder")}
          className="flex-1 h-9 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && canSend) {
              e.preventDefault();
              sendMsg();
            }
          }}
          data-ocid="chat-message-input"
        />
        <Button
          size="icon"
          className="flex-shrink-0 h-9 w-9 min-w-[2.25rem]"
          disabled={!canSend}
          onClick={() => sendMsg()}
          aria-label={t("chat.send.ariaLabel")}
          data-ocid="chat-send-btn"
        >
          {isPending || hasUploading ? (
            <span className="animate-spin text-xs">⏳</span>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
