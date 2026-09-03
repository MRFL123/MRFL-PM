export function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function validateDeliveredItem(name: string, url: string): string | null {
  if (!name.trim()) return "Item name is required.";
  if (!normalizeHttpUrl(url)) return "Enter a valid link.";
  return null;
}
