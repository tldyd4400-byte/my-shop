const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;
const PATH_CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;
const UNSAFE_ENCODED_PATH_CHARACTER = /%(?:23|25|2f|3f|5c)/i;
const MAX_USER_AGENT_CODE_UNITS = 512;
const INTERNAL_BASE_URL = "https://internal.invalid";

export function parseSafePathname(pathname: unknown): string | null {
  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\")
  ) {
    return null;
  }

  const [rawPathname] = pathname.split(/[?#]/u, 1);

  try {
    const decodedPathname = decodeURIComponent(rawPathname);
    if (
      PATH_CONTROL_CHARACTERS.test(decodedPathname) ||
      UNSAFE_ENCODED_PATH_CHARACTER.test(rawPathname)
    ) {
      return null;
    }

    return new URL(pathname, INTERNAL_BASE_URL).pathname;
  } catch {
    return null;
  }
}

export function sanitizePathname(pathname: string): string {
  return parseSafePathname(pathname) ?? "/";
}

export function sanitizeUserAgent(userAgent: string): string {
  if (typeof userAgent !== "string") return "";

  return userAgent
    .replace(CONTROL_CHARACTERS, "")
    .slice(0, MAX_USER_AGENT_CODE_UNITS);
}
