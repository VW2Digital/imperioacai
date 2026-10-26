import type { MenuProduct } from "../../lib/types";
import { formatPrice } from "../../lib/format";
import SmartImage from "../ui/SmartImage";
import styles from "./DishCard.module.css";

interface Props {
  product: MenuProduct;
  onClick: () => void;
}

export default function DishCard({ product, onClick }: Props) {
  return (
    <article
      className={styles.card}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes de ${product.name}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.media}>
        <SmartImage src={product.image_url} alt={product.name} />
        {product.is_new && <span className={styles.badge}>Novo</span>}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        {product.description && <p className={styles.desc}>{product.description}</p>}
        <span className={styles.price}>{formatPrice(product.price)}</span>
      </div>
    </article>
  );
}
