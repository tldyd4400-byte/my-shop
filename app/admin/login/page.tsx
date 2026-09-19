"use client";

import { useActionState } from "react";

import { loginAction, type LoginActionState } from "./actions";
import styles from "../admin.module.css";

const initialState: LoginActionState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className={styles.loginMain}>
      <section className={styles.loginCard} aria-labelledby="admin-login-title">
        <p className={styles.eyebrow}>어믜뜰</p>
        <h1 id="admin-login-title">관리자 로그인</h1>
        <p className={styles.intro}>
          관리자 페이지를 이용하려면 비밀번호를 입력해 주세요.
        </p>

        <form className={styles.form} action={formAction}>
          <input type="hidden" name="next" value="/admin/ai-visits" />
          <label className={styles.label} htmlFor="admin-password">
            비밀번호
          </label>
          <input
            className={styles.input}
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={state.error ? "admin-login-error" : undefined}
          />
          {state.error ? (
            <p id="admin-login-error" className={styles.error} role="alert">
              {state.error}
            </p>
          ) : null}
          <button className={styles.submit} type="submit" disabled={pending}>
            {pending ? "확인 중…" : "로그인"}
          </button>
        </form>
      </section>
    </main>
  );
}
