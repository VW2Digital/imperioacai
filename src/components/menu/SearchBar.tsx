import { Search, X } from "lucide-react";
import styles from "./SearchBar.module.css";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className={styles.bar} role="search">
      <Search size={18} className={styles.icon} aria-hidden="true" />
      <input
        type="search"
        inputMode="search"
        placeholder="Buscar prato, bebida, sobremesa…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Pesquisar no cardápio"
        autoComplete="off"
      />
      {value && (
        <button type="button" className={styles.clear} onClick={() => onChange("")} aria-label="Limpar busca">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
