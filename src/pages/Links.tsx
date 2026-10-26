import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Instagram, MapPin } from "lucide-react";
import { useLinks, useSettings } from "../lib/queries";
import { trackClick, trackView } from "../lib/track";
import { whatsappLink } from "../lib/format";
import type { LinkItem } from "../lib/types";
import SmartImage from "../components/ui/SmartImage";
import { LinkIconByName, WhatsAppIcon } from "../components/ui/icons";
import styles from "./Links.module.css";

function LinkButton({ item }: { item: LinkItem }) {
  const className = `${styles.link} ${item.is_primary ? styles.primary : ""}`;
  const size = item.is_primary ? 22 : 20;
  const onClick = () => trackClick("links", "link", item.id);
  const content: ReactNode = (
    <>
      <span className={styles.icon}>
        <LinkIconByName name={item.icon} size={size} />
      </span>
      <span className={styles.label}>{item.label}</span>
      <ArrowRight size={size - 2} className={styles.arrow} />
    </>
  );

  if (item.url.startsWith("/")) {
    return (
      <Link to={item.url} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      {content}
    </a>
  );
}

export default function LinksPage() {
  const links = useLinks();
  const settings = useSettings();
  const s = settings.data ?? {};

  useEffect(() => {
    document.title = s.site_name ? `${s.site_name} — Links` : "Império Açaí";
  }, [s.site_name]);

  useEffect(() => {
    trackView("links");
  }, []);

  const ordered = [...(links.data ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.logoRing}>
            {settings.isLoading ? (
              <span className={`skeleton ${styles.logoSkeleton}`} />
            ) : (
              <SmartImage src={s.logo_url} alt={s.site_name ?? "Império Açaí"} className={styles.logo} loading="eager" />
            )}
          </div>
          <h1 className={styles.title}>{s.site_name ?? "Império Açaí"}</h1>
          {s.tagline && <p className={styles.tagline}>{s.tagline}</p>}
          {s.opening_hours && <p className={styles.hours}>{s.opening_hours}</p>}
        </header>

        <nav className={styles.links} aria-label="Links">
          {links.isLoading &&
            Array.from({ length: 4 }).map((_, i) => <span key={i} className={`skeleton ${styles.linkSkeleton}`} />)}
          {ordered.map((item) => (
            <LinkButton key={item.id} item={item} />
          ))}
          {links.isError && <p className={styles.error}>Não foi possível carregar os links.</p>}
        </nav>

        <div className={styles.social}>
          {s.whatsapp_number && (
            <a href={whatsappLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={() => trackClick("links", "whatsapp")}>
              <WhatsAppIcon size={22} />
            </a>
          )}
          {s.instagram_handle && (
            <a
              href={`https://www.instagram.com/${s.instagram_handle}/`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              onClick={() => trackClick("links", "instagram")}
            >
              <Instagram size={22} />
            </a>
          )}
          {s.maps_url && (
            <a href={s.maps_url} target="_blank" rel="noopener noreferrer" aria-label="Como chegar" onClick={() => trackClick("links", "maps")}>
              <MapPin size={22} />
            </a>
          )}
        </div>

        {s.address && <p className={styles.address}>{s.address}</p>}
      </section>

      {s.footer_credit_label && (
        <footer className={styles.credit}>
          Desenvolvido por{" "}
          <a href={s.footer_credit_url ?? "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackClick("links", "credit")}>
            {s.footer_credit_label}
          </a>
        </footer>
      )}
    </main>
  );
}
