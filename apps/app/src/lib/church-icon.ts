export function churchFavicon(website: string | null | undefined) {
  if (!website) return null;
  try {
    const url = new URL(website);
    if (!url.hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url.hostname)}&sz=64`;
  } catch {
    return null;
  }
}
