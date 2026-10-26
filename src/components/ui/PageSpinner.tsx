import styles from "./PageSpinner.module.css";

export default function PageSpinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.spinner} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
