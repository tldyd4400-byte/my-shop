"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSession,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import { sanitizeAdminNext } from "@/lib/admin/urls";

export type LoginActionState = Readonly<{
  error: string | null;
}>;

const LOGIN_ERROR = "비밀번호를 확인해 주세요.";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  let next: FormDataEntryValue | null = null;

  try {
    const password = formData.get("password");
    next = formData.get("next");
    if (typeof password !== "string") {
      return { error: LOGIN_ERROR };
    }

    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;
    if (
      typeof passwordHash !== "string" ||
      typeof sessionSecret !== "string" ||
      !(await verifyAdminPassword(password, passwordHash))
    ) {
      return { error: LOGIN_ERROR };
    }

    const token = createAdminSession(sessionSecret);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, adminCookieOptions);
  } catch {
    return { error: LOGIN_ERROR };
  }

  redirect(sanitizeAdminNext(next));
}
