import styles from "./MenuSkeleton.module.css";

export default function MenuSkeleton() {
  return (
    <div className={`container ${styles.wrap}`} aria-busy="true" aria-label="Carregando cardápio">
      <span className={`skeleton ${styles.search}`} />
      <span className={`skeleton ${styles.banner}`} />
      <div className={styles.chips}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={`skeleton ${styles.chip}`} />
        ))}
      </div>
      <span className={`skeleton ${styles.title}`} />
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className={`skeleton ${styles.card}`} />
        ))}
      </div>
    </div>
  );
}
