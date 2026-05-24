import type { MediaAttachment } from "@/backend.d";
import { safeHttpUrl } from "@/utils/safeUrl";
import { FileText, Paperclip } from "lucide-react";

function formatFileSize(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf", "doc", "docx"].includes(ext)) {
    return <FileText className="w-5 h-5 text-primary flex-shrink-0" />;
  }
  return <Paperclip className="w-5 h-5 text-muted-foreground flex-shrink-0" />;
}

interface MediaAttachmentCardProps {
  attachment: MediaAttachment;
}

function safeAttachmentHref(url: string): string | undefined {
  return safeHttpUrl(url);
}

export function MediaAttachmentCard({ attachment }: MediaAttachmentCardProps) {
  const href = safeAttachmentHref(attachment.url);
  if (!href) {
    return (
      <div
        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-muted/40"
        data-ocid="media-attachment-card"
      >
        <FileIcon fileName={attachment.fileName} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {attachment.fileName}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatFileSize(attachment.fileSize)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <a
      href={href}
      download={attachment.fileName}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors group"
      data-ocid="media-attachment-card"
    >
      <FileIcon fileName={attachment.fileName} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {attachment.fileName}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatFileSize(attachment.fileSize)}
        </p>
      </div>
    </a>
  );
}
