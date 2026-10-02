export function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function passwordError(password: string, confirmation: string) {
  if (password.length < 8 || password.length > 128) return "Use a password of 8–128 characters.";
  if (password !== confirmation) return "The passwords do not match.";
  return null;
}

export function authOrigin(configured: string | undefined, fallback: string | null) {
  try {
    const url = new URL(configured?.trim() || fallback || "");
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return null;
    return url.origin;
  } catch { return null; }
}
