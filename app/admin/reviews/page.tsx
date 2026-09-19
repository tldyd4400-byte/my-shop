import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { OnlineReviewsDashboard } from "@/components/admin/online-reviews-dashboard";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin/auth";
import { loadOnlineReviewDashboard } from "@/lib/online-reviews/repository";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
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

  const dashboard = await (async () => {
    try {
      return await loadOnlineReviewDashboard();
    } catch {
      return null;
    }
  })();

  if (dashboard === null) {
    return (
      <main className={styles.dashboardMain} aria-labelledby="reviews-error-title">
        <header className={styles.dashboardHeader}>
          <div>
            <p className={styles.eyebrow}>관리자 후기 관리</p>
            <h1 id="reviews-error-title">후기 승인 관리</h1>
          </div>
          <nav className={styles.adminNav} aria-label="관리자 메뉴">
            <Link className={styles.logoutLink} href="/admin/ai-visits">
              AI 방문 통계
            </Link>
            <Link className={styles.logoutLink} href="/admin/logout">
              로그아웃
            </Link>
          </nav>
        </header>
        <p className={styles.loadError} role="alert">
          후기 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.
        </p>
      </main>
    );
  }

  return <OnlineReviewsDashboard dashboard={dashboard} />;
}
