/** Client-side encryption for digital listing uploads (E2.S11). */

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/epub+zip",
  "video/mp4",
]);

export const MAX_DIGITAL_FILE_BYTES = 524_288_000; // 500 MiB

export function validateDigitalFile(file: File): string | null {
  if (file.size > MAX_DIGITAL_FILE_BYTES) {
    return "File exceeds 500MB limit";
  }
  const mime = file.type || guessMime(file.name);
  if (!ALLOWED_MIMES.has(mime)) {
    return "Unsupported file type";
  }
  return null;
}

function guessMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".zip")) return "application/zip";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".epub")) return "application/epub+zip";
  if (lower.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

export type EncryptedDigitalUpload = {
  encryptedBytes: Uint8Array;
  dekHex: string;
  contentHash: string;
  mimeType: string;
  sizeBytes: number;
};

/** Encrypt file with a random AES-GCM key; returns ciphertext + DEK for backend storage. */
export async function encryptDigitalFile(
  file: File,
): Promise<EncryptedDigitalUpload> {
  const validation = validateDigitalFile(file);
  if (validation) throw new Error(validation);

  const plain = await file.arrayBuffer();
  const contentHash = await sha256Hex(plain);
  const dek = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.importKey(
    "raw",
    dek,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plain,
  );

  const encryptedBytes = new Uint8Array(12 + cipher.byteLength);
  encryptedBytes.set(iv, 0);
  encryptedBytes.set(new Uint8Array(cipher), 12);

  return {
    encryptedBytes,
    dekHex: toHex(dek),
    contentHash: `sha256:${contentHash}`,
    mimeType: file.type || guessMime(file.name),
    sizeBytes: file.size,
  };
}
