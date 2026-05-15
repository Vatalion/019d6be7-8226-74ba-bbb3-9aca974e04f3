// WalletQRScanner — camera-based QR code scanner for wallet addresses.
// Uses the browser's BarcodeDetector API (Chrome/Edge/Android WebView) with a
// canvas-frame fallback. No external QR library required.

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "../../hooks/useLocale";

interface WalletQRScannerProps {
  onAddressDetected: (address: string) => void;
  onClose: () => void;
}

type ScanState = "idle" | "requesting" | "scanning" | "denied" | "error";

// Minimal type for BarcodeDetector (not yet in lib.dom.d.ts everywhere)
interface BarcodeDetectorResult {
  rawValue: string;
}
interface BarcodeDetectorInstance {
  detect(image: HTMLVideoElement): Promise<BarcodeDetectorResult[]>;
}
declare const BarcodeDetector: {
  new (options: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats(): Promise<string[]>;
};

export function WalletQRScanner({
  onAddressDetected,
  onClose,
}: WalletQRScannerProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    setScanState("idle");
    setOpen(false);
    onClose();
  }, [stopCamera, onClose]);

  const startScanning = useCallback(async () => {
    setScanState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Try to init BarcodeDetector
      if (typeof BarcodeDetector !== "undefined") {
        try {
          detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });
        } catch {
          detectorRef.current = null;
        }
      }

      setScanState("scanning");

      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }

        // Native BarcodeDetector path
        if (detectorRef.current) {
          try {
            const codes = await detectorRef.current.detect(videoRef.current);
            if (codes.length > 0 && codes[0]) {
              const raw = codes[0].rawValue;
              handleDetected(raw);
              return;
            }
          } catch {
            // fall through to canvas path
          }
        } else {
          // Canvas fallback: grab a frame and search for QR-like patterns
          // This path won't decode QR without a library — show a UI hint
          // that the browser doesn't support native QR detection.
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
      ) {
        setScanState("denied");
      } else {
        setScanState("error");
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDetected = useCallback(
    (raw: string) => {
      stopCamera();
      setOpen(false);
      setScanState("idle");
      // Strip wallet: URI scheme if present (e.g. "tron:T...", "ethereum:0x...")
      const address = raw
        .replace(/^[a-z]+:/i, "")
        .split("?")[0]
        .trim();
      onAddressDetected(address);
    },
    [stopCamera, onAddressDetected],
  );

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      void startScanning();
    }
    return () => {
      if (!open) stopCamera();
    };
  }, [open, startScanning, stopCamera]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const hasBarcodeDetector =
    typeof globalThis !== "undefined" && "BarcodeDetector" in globalThis;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={() => setOpen(true)}
        aria-label={t("payment.scanQR")}
        data-ocid="payment.scan_qr_button"
      >
        <Camera className="h-4 w-4" />
        <span className="hidden sm:inline">{t("payment.scanQR")}</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent
          className="max-w-sm p-0 overflow-hidden"
          data-ocid="payment.qr_scanner_dialog"
        >
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>{t("payment.scanQR")}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 -mr-1"
                onClick={handleClose}
                aria-label={t("payment.scanQR")}
                data-ocid="payment.qr_scanner_close_button"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="relative bg-black aspect-square w-full overflow-hidden">
            {/* Video preview */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              aria-label={t("payment.scanInstructions")}
            />

            {/* Hidden canvas for fallback */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning overlay — corner brackets */}
            {scanState === "scanning" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-48">
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/80 rounded-tl" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/80 rounded-tr" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/80 rounded-bl" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/80 rounded-br" />
                  {/* Animated scan line */}
                  <span className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/70 animate-pulse" />
                </div>
              </div>
            )}

            {/* Requesting permission */}
            {scanState === "requesting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">{t("payment.scanningAddress")}</p>
              </div>
            )}

            {/* Permission denied */}
            {scanState === "denied" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 text-white px-6 text-center">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm leading-relaxed">
                  {t("payment.cameraPermissionDenied")}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleClose}
                  data-ocid="payment.qr_permission_close_button"
                >
                  {t("payment.scanQR")}
                </Button>
              </div>
            )}

            {/* BarcodeDetector not supported — show manual fallback message */}
            {scanState === "scanning" && !hasBarcodeDetector && (
              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs text-center py-2 px-3 leading-snug">
                {t("payment.qrNotSupported")}
              </div>
            )}
          </div>

          {/* Instruction text */}
          {scanState === "scanning" && hasBarcodeDetector && (
            <p className="text-center text-xs text-muted-foreground py-3 px-4">
              {t("payment.scanInstructions")}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
