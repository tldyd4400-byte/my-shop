"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin/auth";
import { moderateOnlineReview } from "@/lib/online-reviews/repository";
import type { OnlineReviewStatus } from "@/lib/online-reviews/types";

const ALLOWED_STATUSES = new Set(["approved", "rejected", "pending"]);

export async function moderateOnlineReviewAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (
    typeof sessionSecret !== "string" ||
    typeof sessionToken !== "string" ||
    !verifyAdminSession(sessionToken, sessionSecret)
  ) {
    redirect("/admin/login?next=%2Fadmin%2Freviews");
  }

  const sourceUrl = formData.get("sourceUrl");
  const status = formData.get("status");
  if (
    typeof sourceUrl !== "string" ||
    typeof status !== "string" ||
    !ALLOWED_STATUSES.has(status)
  ) {
    return;
  }

  try {
    await moderateOnlineReview(sourceUrl, status as OnlineReviewStatus);
  } catch {
    return;
  }

  revalidatePath("/");
  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
}
