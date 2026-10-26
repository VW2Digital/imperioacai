import { Instagram, MapPin, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";
import type { Settings } from "../../lib/types";
import { whatsappLink } from "../../lib/format";
import { trackClick } from "../../lib/track";
import { WhatsAppIcon } from "../ui/icons";
import SmartImage from "../ui/SmartImage";
import styles from "./SiteFooter.module.css";

export default function SiteFooter({ settings }: { settings: Settings }) {
  const name = settings.site_name ?? "Império Açaí";

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            {settings.logo_url ? (
              <span className={styles.logo}>
                <SmartImage src={settings.logo_url} alt={name} />
              </span>
            ) : (
              <span className={styles.logoFallback}>
                <UtensilsCrossed size={22} />
              </span>
            )}
            <div>
              <strong>{name}</strong>
              {settings.tagline && <p>{settings.tagline}</p>}
            </div>
          </div>

          <div className={styles.contacts}>
            {settings.whatsapp_number && (
              <a
                href={whatsappLink(settings.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contact}
                onClick={() => trackClick("menu", "whatsapp")}
              >
                <span className={styles.iconWa}>
                  <WhatsAppIcon size={20} />
                </span>
                <span>
                  <small>WhatsApp</small>
                  <strong>{settings.whatsapp_display ?? settings.whatsapp_number}</strong>
                </span>
              </a>
            )}
            {settings.instagram_handle && (
              <a
                href={`https://www.instagram.com/${settings.instagram_handle}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contact}
                onClick={() => trackClick("menu", "instagram")}
              >
                <span className={styles.iconIg}>
                  <Instagram size={20} />
                </span>
                <span>
                  <small>Instagram</small>
                  <strong>@{settings.instagram_handle}</strong>
                </span>
              </a>
            )}
            {settings.address && (
              <a
                href={settings.maps_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contact}
                onClick={() => trackClick("menu", "maps")}
              >
                <span className={styles.iconMap}>
                  <MapPin size={20} />
                </span>
                <span>
                  <small>Endereço</small>
                  <strong className={styles.addressText}>{settings.address}</strong>
                </span>
              </a>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <span>
            © {new Date().getFullYear()} {name}
            {" · "}
            <Link to="/">Todos os links</Link>
          </span>
          {settings.footer_credit_label && (
            <span>
              Desenvolvido por{" "}
              <a
                href={settings.footer_credit_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick("menu", "credit")}
              >
                {settings.footer_credit_label}
              </a>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
