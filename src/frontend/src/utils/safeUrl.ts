/** Allow only http(s) URLs for user-controlled href/src attributes. */
export function safeHttpUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Strip trailing punctuation often captured by URL regex in chat messages. */
export function trimUrlPunctuation(url: string): string {
  return url.replace(/[.,);:\]}>]+$/, "");
}
