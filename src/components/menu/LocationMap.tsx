import { Instagram, MapPin, Navigation } from "lucide-react";
import type { Settings } from "../../lib/types";
import { whatsappLink } from "../../lib/format";
import { trackClick } from "../../lib/track";
import { WhatsAppIcon } from "../ui/icons";
import styles from "./LocationMap.module.css";

export default function LocationMap({ settings }: { settings: Settings }) {
  if (!settings.address && !settings.maps_embed_url) return null;

  return (
    <section className={`container ${styles.section}`} aria-labelledby="map-title">
      <div className={styles.card}>
        <div className={styles.info}>
          <span className={styles.eyebrow}>Visite-nos</span>
          <h2 id="map-title">
            <MapPin size={22} /> Como chegar
          </h2>

          {settings.address && <p className={styles.address}>{settings.address}</p>}

          <div className={styles.actions}>
            {settings.maps_url && (
              <a
                href={settings.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryBtn}
                onClick={() => trackClick("menu", "maps")}
              >
                <Navigation size={16} /> Traçar rota
              </a>
            )}
            {settings.whatsapp_number && (
              <a
                href={whatsappLink(settings.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ghostBtn}
                onClick={() => trackClick("menu", "whatsapp")}
              >
                <WhatsAppIcon size={16} /> Falar no WhatsApp
              </a>
            )}
            {settings.instagram_handle && (
              <a
                href={`https://www.instagram.com/${settings.instagram_handle}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ghostBtn}
                onClick={() => trackClick("menu", "instagram")}
              >
                <Instagram size={16} /> @{settings.instagram_handle}
              </a>
            )}
          </div>
        </div>

        {settings.maps_embed_url && (
          <div className={styles.frameWrap}>
            <iframe
              src={settings.maps_embed_url}
              title="Localização no Google Maps"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </section>
  );
}
