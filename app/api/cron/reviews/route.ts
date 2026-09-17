import { isAuthorizedCronRequest } from "@/lib/online-reviews/cron-auth";
import { syncOnlineReviews } from "@/lib/online-reviews/sync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!isAuthorizedCronRequest(authorization, secret)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    const result = await syncOnlineReviews();
    if (result.partialFailure) {
      return Response.json({ ok: false }, { status: 503 });
    }
    return Response.json({ ok: true, discoveredCount: result.discoveredCount });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
