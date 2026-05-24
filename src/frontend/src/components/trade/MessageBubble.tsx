import type { MediaAttachment, Message } from "@/backend.d";
import { safeHttpUrl, trimUrlPunctuation } from "@/utils/safeUrl";
import { Paperclip } from "lucide-react";
import { useState } from "react";
import { LightboxGallery } from "./LightboxGallery";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { MediaAttachmentCard } from "./MediaAttachmentCard";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function formatTime(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AttachmentItem({
  att,
  idx,
  onImageClick,
}: {
  att: MediaAttachment;
  idx: number;
  onImageClick: (url: string) => void;
}) {
  const safeUrl = safeHttpUrl(att.url);
  if (att.mimeType.startsWith("image/")) {
    if (!safeUrl) {
      return (
        <p className="text-xs text-muted-foreground italic">
          {att.fileName} (unsupported link)
        </p>
      );
    }
    return (
      <button
        type="button"
        className="w-full p-0 border-0 bg-transparent cursor-pointer"
        onClick={() => onImageClick(safeUrl)}
        aria-label={`View ${att.fileName}`}
        data-ocid={`chat-image-attachment.${idx + 1}`}
      >
        <img
          src={safeUrl}
          alt={att.fileName}
          className="max-h-48 sm:max-h-60 rounded-lg object-cover w-full"
        />
      </button>
    );
  }
  if (att.mimeType.startsWith("video/")) {
    if (!safeUrl) {
      return (
        <p className="text-xs text-muted-foreground italic">
          {att.fileName} (unsupported link)
        </p>
      );
    }
    return (
      <video
        src={safeUrl}
        controls
        className="max-h-48 sm:max-h-60 rounded-lg w-full"
        data-ocid={`chat-video-attachment.${idx + 1}`}
      >
        <track kind="captions" />
      </video>
    );
  }
  return <MediaAttachmentCard attachment={att} />;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
}

export function MessageBubble({
  message,
  isOwn,
  senderName,
}: MessageBubbleProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Extract first URL from message content for link preview
  const urlMatch = message.content.match(URL_REGEX);
  const firstUrl = urlMatch
    ? safeHttpUrl(trimUrlPunctuation(urlMatch[0]))
    : null;

  return (
    <>
      <div
        className={`flex flex-col gap-0.5 max-w-[85%] sm:max-w-[78%] ${isOwn ? "ml-auto items-end" : "items-start"}`}
      >
        {/* Sender name (for received messages) */}
        {!isOwn && (
          <span className="text-[10px] text-muted-foreground px-1 font-medium">
            {senderName}
          </span>
        )}

        <div
          className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-sm leading-relaxed break-words min-w-0 max-w-full ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          }`}
        >
          {/* Text content */}
          {message.content && (
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Link preview */}
          {firstUrl && (
            <div className={isOwn ? "opacity-90" : ""}>
              <LinkPreviewCard url={firstUrl} />
            </div>
          )}

          {/* Media attachments */}
          {message.attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {message.attachments.map((att, idx) => (
                <AttachmentItem
                  key={att.url}
                  att={att}
                  idx={idx}
                  onImageClick={(url) => setLightboxUrl(url)}
                />
              ))}
            </div>
          )}

          {/* Legacy attachmentUrl fallback */}
          {message.attachments.length === 0 && message.attachmentUrl && (
            <a
              href={message.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 mt-1.5 text-xs underline opacity-80 hover:opacity-100 truncate max-w-[240px]"
            >
              <Paperclip className="w-3 h-3 flex-shrink-0" />
              attachment
            </a>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(message.sentAt)}
        </span>
      </div>

      {/* Lightbox */}
      <LightboxGallery
        isOpen={lightboxUrl !== null}
        imageUrl={lightboxUrl ?? ""}
        onClose={() => setLightboxUrl(null)}
      />
    </>
  );
}
