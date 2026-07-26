const INTERNAL_BASE_URL = "https://internal.invalid";
const PUBLIC_METHODS = new Set(["GET", "HEAD"]);
const EXCLUDED_ROUTE_PREFIX =
  /^\/(?:admin|api|_next|images|media|uploads)(?:\/|$)/;
const EXCLUDED_SPECIAL_PATH =
  /^\/(?:favicon(?:\.[^/]+)?|robots\.txt|sitemap(?:[-.][^/]*)?)(?:\/|$)/;
const STATIC_EXTENSION =
  /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|tiff?|webp|m4v|mkv|mov|mp4|mpeg|mpg|ogv|webm|aac|flac|m4a|mp3|oga|ogg|opus|wav|woff2?|eot|otf|ttf|css|js|mjs|cjs|map|json|xml|ya?ml|csv|docx?|epub|od[psst]|pdf|pptx?|rtf|txt|xlsx?|7z|bz2|gz|rar|tar|tgz|zip)$/i;

export type CollectableRequest = {
  method: string;
  pathname: string;
};

export function isCollectableRequest(
  request: CollectableRequest | null | undefined,
): boolean {
  if (
    !request ||
    typeof request.method !== "string" ||
    typeof request.pathname !== "string"
  ) {
    return false;
  }

  if (!PUBLIC_METHODS.has(request.method.toUpperCase())) return false;

  let pathname: string;
  try {
    pathname = new URL(request.pathname, INTERNAL_BASE_URL).pathname;
  } catch {
    return false;
  }

  return (
    !EXCLUDED_ROUTE_PREFIX.test(pathname) &&
    !EXCLUDED_SPECIAL_PATH.test(pathname) &&
    !STATIC_EXTENSION.test(pathname)
  );
}
