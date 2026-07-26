const ADMIN_LANDING_PATH = "/admin/ai-visits" as const;
const MAX_PATH_LENGTH = 2_048;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;
const APPROVED_DECODED_VARIANTS = new Set([
  '/admin/ai-visits"',
  "/admin/ai-visit",
]);

export function sanitizeAdminNext(value: unknown): typeof ADMIN_LANDING_PATH {
  void value;
  return ADMIN_LANDING_PATH;
}

export function canonicalizeAdminPath(pathname: unknown): string | null {
  if (
    typeof pathname !== "string" ||
    pathname.length === 0 ||
    pathname.length > MAX_PATH_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(pathname) ||
    pathname.includes("\\") ||
    pathname.includes("?") ||
    pathname.includes("#")
  ) {
    return null;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (
    CONTROL_CHARACTER_PATTERN.test(decoded) ||
    decoded.includes("\\") ||
    decoded.includes("?") ||
    decoded.includes("#") ||
    decoded.startsWith("//")
  ) {
    return null;
  }

  return APPROVED_DECODED_VARIANTS.has(decoded) ? ADMIN_LANDING_PATH : null;
}
