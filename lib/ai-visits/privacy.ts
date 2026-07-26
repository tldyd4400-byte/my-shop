const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;
const MAX_USER_AGENT_CODE_UNITS = 512;
const INTERNAL_BASE_URL = "https://internal.invalid";

export function sanitizePathname(pathname: string): string {
  if (typeof pathname !== "string") return "/";

  try {
    return new URL(pathname, INTERNAL_BASE_URL).pathname;
  } catch {
    return "/";
  }
}

export function sanitizeUserAgent(userAgent: string): string {
  if (typeof userAgent !== "string") return "";

  return userAgent
    .replace(CONTROL_CHARACTERS, "")
    .slice(0, MAX_USER_AGENT_CODE_UNITS);
}
