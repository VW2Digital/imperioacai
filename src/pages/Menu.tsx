import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, SearchX } from "lucide-react";
import { useMenu } from "../lib/queries";
import { trackClick, trackView } from "../lib/track";
import { normalize, whatsappLink } from "../lib/format";
import type { MenuCategory, MenuProduct } from "../lib/types";
import SmartImage from "../components/ui/SmartImage";
import { WhatsAppIcon } from "../components/ui/icons";
import SearchBar from "../components/menu/SearchBar";
import BannerCarousel from "../components/menu/BannerCarousel";
import CategoryChips from "../components/menu/CategoryChips";
import DishCard from "../components/menu/DishCard";
import DishModal from "../components/menu/DishModal";
import HoursSection from "../components/menu/HoursSection";
import LocationMap from "../components/menu/LocationMap";
import SiteFooter from "../components/menu/SiteFooter";
import MenuSkeleton from "../components/menu/MenuSkeleton";
import styles from "./Menu.module.css";

const ALL = "todos";

export default function MenuPage() {
  const menu = useMenu();
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState<string>(ALL);
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollingTo = useRef<string | null>(null);

  const settings = menu.data?.settings ?? {};
  const categories = menu.data?.categories ?? [];

  useEffect(() => {
    document.title = settings.site_name ? `Cardápio — ${settings.site_name}` : "Cardápio Império Açaí";
  }, [settings.site_name]);

  useEffect(() => {
    trackView("menu");
  }, []);

  // Filtra por busca (ignora acentos)
  const term = normalize(search.trim());
  const visible: MenuCategory[] = useMemo(() => {
    return categories
      .map((c) => ({
        ...c,
        products: term
          ? c.products.filter((p) =>
              normalize(`${p.name} ${p.description ?? ""} ${p.price}`).includes(term)
            )
          : c.products,
      }))
      .filter((c) => c.products.length > 0);
  }, [categories, term]);

  const totalVisible = visible.reduce((acc, c) => acc + c.products.length, 0);
  const newArrivals = useMemo(
    () => categories.flatMap((c) => c.products.filter((p) => p.is_new)).slice(0, 8),
    [categories]
  );

  // Scroll-spy: destaca a categoria visivel enquanto rola
  useEffect(() => {
    if (term) return;
    const els = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (scrollingTo.current) return;
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setHighlight(hit.target.getAttribute("data-slug") ?? ALL);
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [visible, term]);

  function openDish(product: MenuProduct) {
    trackClick("menu", "product", product.id);
    setSelected(product);
  }

  function handleSelectCategory(slug: string) {
    setSearch("");
    if (slug === ALL) {
      setHighlight(ALL);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Mantem todas as secoes visiveis e rola ate a escolhida
    setHighlight(slug);
    scrollingTo.current = slug;
    requestAnimationFrame(() => {
      const el = sectionRefs.current[slug];
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 132;
        window.scrollTo({ top, behavior: "smooth" });
      }
      window.setTimeout(() => (scrollingTo.current = null), 700);
    });
  }

  const chipActive = term ? ALL : highlight;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link to="/" className={styles.back} aria-label="Voltar para a página inicial">
            <ChevronLeft size={22} />
          </Link>
          <SmartImage src={settings.logo_url} alt={settings.site_name ?? "Império Açaí"} className={styles.logo} loading="eager" />
          <div className={styles.searchWrap}>
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </header>

      {menu.isLoading && <MenuSkeleton />}

      {menu.isError && (
        <div className={`container ${styles.errorBox}`}>
          <p>Não foi possível carregar o cardápio.</p>
          <button onClick={() => menu.refetch()}>Tentar novamente</button>
        </div>
      )}

      {menu.data && (
        <>
          <div className={`container ${styles.mobileSearch}`}>
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {!term && menu.data.banners.length > 0 && (
            <section className={`container ${styles.banners}`} aria-label={settings.new_arrivals_title ?? "Novidades"}>
              <BannerCarousel banners={menu.data.banners} />
            </section>
          )}

          <div className={styles.chipsBar}>
            <div className="container">
              <CategoryChips categories={categories} active={chipActive} onSelect={handleSelectCategory} />
            </div>
          </div>

          <main className={`container ${styles.main}`}>
            {!term && newArrivals.length > 0 && (
              <section className={styles.section} aria-label="Novidades do cardápio">
                <div className={styles.sectionHead}>
                  <h2>Novidades</h2>
                  <span>{newArrivals.length} {newArrivals.length === 1 ? "item" : "itens"}</span>
                </div>
                <div className={styles.rail}>
                  {newArrivals.map((p) => (
                    <div key={p.id} className={styles.railItem}>
                      <DishCard product={p} onClick={() => openDish(p)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {term && (
              <div className={styles.resultsHead}>
                <h2>Resultados para “{search.trim()}”</h2>
                <span>{totalVisible} {totalVisible === 1 ? "prato" : "pratos"}</span>
              </div>
            )}

            {visible.map((cat) => (
              <section
                key={cat.id}
                id={`cat-${cat.slug}`}
                data-slug={cat.slug}
                ref={(el) => (sectionRefs.current[cat.slug] = el)}
                className={styles.section}
              >
                <div className={styles.sectionHead}>
                  <h2>{cat.name}</h2>
                  <span>{cat.products.length} {cat.products.length === 1 ? "item" : "itens"}</span>
                </div>
                <div className={styles.grid}>
                  {cat.products.map((p) => (
                    <DishCard key={p.id} product={p} onClick={() => openDish(p)} />
                  ))}
                </div>
              </section>
            ))}

            {visible.length === 0 && (
              <div className={styles.empty}>
                <SearchX size={40} />
                <p>Nenhum prato encontrado.</p>
                <button onClick={() => setSearch("")}>Limpar busca</button>
              </div>
            )}
          </main>

          <div className={styles.place}>
            <HoursSection settings={settings} />
            <LocationMap settings={settings} />
          </div>
          <SiteFooter settings={settings} />

          {settings.whatsapp_number && (
            <a
              className={styles.fab}
              href={whatsappLink(settings.whatsapp_number, "Olá! Vim pelo cardápio online.")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar no WhatsApp"
              onClick={() => trackClick("menu", "whatsapp")}
            >
              <WhatsAppIcon size={26} />
            </a>
          )}
        </>
      )}

      <DishModal product={selected} settings={settings} onClose={() => setSelected(null)} />
    </div>
  );
}
