const NAVER_BLOG_SEARCH_ENDPOINT =
  "https://naverapihub.apigw.ntruss.com/search/v1/blog";

export type NaverBlogSearchOptions = {
  clientId?: string;
  clientSecret?: string;
  fetcher?: typeof fetch;
};

export async function searchNaverBlog(
  query: string,
  options: NaverBlogSearchOptions = {},
): Promise<unknown[]> {
  const clientId =
    options.clientId ?? process.env.NAVER_API_HUB_CLIENT_ID ?? "";
  const clientSecret =
    options.clientSecret ?? process.env.NAVER_API_HUB_CLIENT_SECRET ?? "";
  const fetcher = options.fetcher ?? fetch;

  if (clientId.length === 0 || clientSecret.length === 0) {
    throw new Error("NAVER_API_CREDENTIALS_MISSING");
  }

  const url = new URL(NAVER_BLOG_SEARCH_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("display", "20");
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "date");
  url.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetcher(url.toString(), {
      method: "GET",
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error("NAVER_API_REQUEST_FAILED");
  }

  if (!response.ok) {
    throw new Error("NAVER_API_REQUEST_FAILED");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("NAVER_API_RESPONSE_INVALID");
  }

  if (body === null || typeof body !== "object") return [];
  try {
    const items = (body as Record<string, unknown>).items;
    return Array.isArray(items) ? items.slice(0, 20) : [];
  } catch {
    return [];
  }
}
