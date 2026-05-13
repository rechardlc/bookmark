const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "spm"
]);

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";

    for (const key of Array.from(url.searchParams.keys())) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.startsWith("utm_") || TRACKING_PARAMS.has(normalizedKey)) {
        url.searchParams.delete(key);
      }
    }

    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }

    let normalized = url.toString();
    if (url.searchParams.size === 0) {
      normalized = normalized.replace(/\?$/, "");
    }
    return normalized;
  } catch {
    return trimmed;
  }
}
