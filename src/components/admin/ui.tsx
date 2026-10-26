import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { X } from "lucide-react";
import SmartImage from "../ui/SmartImage";
import styles from "./ui.module.css";

/* ---------- Pagina ---------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}

/* ---------- Botoes ---------- */
type Variant = "primary" | "secondary" | "ghost" | "danger";
export function Button({
  variant = "primary",
  size = "md",
  loading,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; loading?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || loading}
      className={`${styles.btn} ${styles[variant]} ${size === "sm" ? styles.sm : ""} ${className}`}
    >
      {loading ? <span className={styles.btnSpinner} /> : children}
    </button>
  );
}

export function IconButton({ label, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} title={label} {...rest} className={`${styles.iconBtn} ${className}`} />;
}

/* ---------- Form ---------- */
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

// forwardRef e obrigatorio para o react-hook-form (register) acessar o elemento
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input {...props} ref={ref} className={`${styles.input} ${props.className ?? ""}`} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(props, ref) {
  return <textarea rows={3} {...props} ref={ref} className={`${styles.input} ${styles.textarea} ${props.className ?? ""}`} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(props, ref) {
  return <select {...props} ref={ref} className={`${styles.input} ${styles.select} ${props.className ?? ""}`} />;
});

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`${styles.switch} ${checked ? styles.on : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

/* ---------- Modal ---------- */
export function Modal({ title, open, onClose, children, width = 560 }: { title: string; open: boolean; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.modal} style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h2>{title}</h2>
          <IconButton label="Fechar" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, onCancel, onConfirm, loading }: { open: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void; loading?: boolean }) {
  return (
    <Modal title={title} open={open} onClose={onCancel} width={420}>
      <p className={styles.confirmText}>{message}</p>
      <div className={styles.formActions}>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Excluir
        </Button>
      </div>
    </Modal>
  );
}

/* ---------- Tabela ---------- */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={styles.empty}>{children}</div>;
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className={styles.formActions}>{children}</div>;
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className={styles.formGrid}>{children}</div>;
}

export function Thumb({ src, alt = "" }: { src?: string | null; alt?: string }) {
  return (
    <span className={styles.thumb}>
      {src ? <SmartImage src={src} alt={alt} /> : <span className={styles.thumbEmpty}>—</span>}
    </span>
  );
}
