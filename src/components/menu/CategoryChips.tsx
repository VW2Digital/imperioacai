import { useEffect, useRef } from "react";
import { LayoutGrid } from "lucide-react";
import type { MenuCategory } from "../../lib/types";
import SmartImage from "../ui/SmartImage";
import styles from "./CategoryChips.module.css";

interface Props {
  categories: MenuCategory[];
  active: string;
  onSelect: (slug: string) => void;
}

/** Quebra palavras longas sem espaço, para o nome caber no chip. */
function CategoryName({ name }: { name: string }) {
  const parts = name.split(/(\s+)/);
  return (
    <span className={styles.name}>
      {parts.map((part, i) => {
        if (/\s/.test(part) || part.length <= 12) return part;
        const suffix = part.match(/(mentos|mento|ções|ção|mente|dades|dade)$/i);
        const at = suffix?.index && suffix.index >= 4 ? suffix.index : Math.ceil(part.length / 2);
        return (
          <span key={i}>
            {part.slice(0, at)}
            <wbr />
            {part.slice(at)}
          </span>
        );
      })}
    </span>
  );
}

export default function CategoryChips({ categories, active, onSelect }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // Mantem a categoria ativa visivel no scroll horizontal
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const total = (categories || []).reduce((n, c) => n + (c.products?.length ?? 0), 0);

  return (
    <div className={styles.list} ref={listRef} role="tablist" aria-label="Categorias">
      <button
        type="button"
        role="tab"
        data-slug="todos"
        aria-selected={active === "todos"}
        className={`${styles.chip} ${active === "todos" ? styles.active : ""}`}
        onClick={() => onSelect("todos")}
      >
        <span className={styles.thumb}>
          <LayoutGrid size={22} />
        </span>
        <CategoryName name="Todos" />
        <span className={styles.count}>{total}</span>
      </button>

      {(categories || []).map((c) => (
        <button
          key={c.id}
          type="button"
          role="tab"
          data-slug={c.slug}
          aria-selected={active === c.slug}
          className={`${styles.chip} ${active === c.slug ? styles.active : ""}`}
          onClick={() => onSelect(c.slug)}
        >
          <span className={styles.thumb}>
            <SmartImage src={c.image_url} alt="" />
          </span>
          <CategoryName name={c.name} />
          <span className={styles.count}>{c.products?.length ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
