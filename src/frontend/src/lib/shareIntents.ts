export type ShareTargetLabelKey =
  | "detail.share.telegram"
  | "detail.share.whatsapp"
  | "detail.share.viber"
  | "detail.share.facebook"
  | "detail.share.x"
  | "detail.share.email";

export type ShareTarget = {
  id: string;
  labelKey: ShareTargetLabelKey;
  href: string;
};

export function canUseNativeShare(data: ShareData): boolean {
  if (typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare === "function") {
    try {
      return navigator.canShare(data);
    } catch {
      return true;
    }
  }
  return true;
}

export async function openNativeShare(data: ShareData): Promise<void> {
  await navigator.share(data);
}

export function buildShareTargets(url: string, title: string): ShareTarget[] {
  const text = title.trim() || url;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const encodedBody = encodeURIComponent(`${text}\n\n${url}`);

  return [
    {
      id: "telegram",
      labelKey: "detail.share.telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      id: "whatsapp",
      labelKey: "detail.share.whatsapp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
      id: "viber",
      labelKey: "detail.share.viber",
      href: `viber://forward?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
      id: "facebook",
      labelKey: "detail.share.facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: "x",
      labelKey: "detail.share.x",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      id: "email",
      labelKey: "detail.share.email",
      href: `mailto:?subject=${encodedText}&body=${encodedBody}`,
    },
  ];
}
