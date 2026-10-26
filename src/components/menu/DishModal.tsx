import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { MenuProduct, Settings } from "../../lib/types";
import { formatPrice, whatsappLink } from "../../lib/format";
import { trackClick } from "../../lib/track";
import SmartImage from "../ui/SmartImage";
import { WhatsAppIcon } from "../ui/icons";
import styles from "./DishModal.module.css";

interface Props {
  product: MenuProduct | null;
  settings: Settings;
  onClose: () => void;
}

export default function DishModal({ product, settings, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!product) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [product, onClose]);

  if (!product) return null;

  const wa = settings.whatsapp_number
    ? whatsappLink(settings.whatsapp_number, `Olá! Gostaria de pedir: ${product.name} (${formatPrice(product.price)}).`)
    : null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className={styles.close} onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>
        <div className={styles.media}>
          <SmartImage src={product.image_url} alt={product.name} loading="eager" />
          {product.is_new && <span className={styles.badge}>Novo</span>}
        </div>
        <div className={styles.info}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          <h2 id="dish-title" className={styles.title}>
            {product.name}
          </h2>
          {product.description && <p className={styles.desc}>{product.description}</p>}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={styles.cta} onClick={() => trackClick("menu", "whatsapp")}>
              <WhatsAppIcon size={20} />
              Pedir pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
