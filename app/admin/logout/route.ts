import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
} from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    ...adminCookieOptions,
    maxAge: 0,
  });

  return NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  });
}
