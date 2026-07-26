import styles from "./admin.module.css";

export default function AdminNotFound() {
  return (
    <main className={styles.loginMain}>
      <section className={styles.loginCard}>
        <p className={styles.eyebrow}>404</p>
        <h1>관리자 페이지를 찾을 수 없습니다.</h1>
        <p className={styles.intro}>주소를 확인한 뒤 다시 시도해 주세요.</p>
      </section>
    </main>
  );
}
