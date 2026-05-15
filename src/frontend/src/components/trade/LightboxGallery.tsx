import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface LightboxGalleryProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

export function LightboxGallery({
  isOpen,
  imageUrl,
  onClose,
}: LightboxGalleryProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <dialog
      open
      className="fixed inset-0 m-0 w-full h-full max-w-none max-h-none bg-black/90 z-50 flex items-center justify-center p-0 border-none"
      data-ocid="lightbox-gallery"
      aria-label="Image viewer"
    >
      {/* Close button */}
      <button
        type="button"
        className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        aria-label="Close"
        data-ocid="lightbox-gallery.close_button"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Backdrop — click outside image to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close lightbox"
      />

      {/* Image */}
      <img
        src={imageUrl}
        alt="Full size"
        className="relative max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={() => {}}
      />
    </dialog>,
    document.body,
  );
}
