import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner } from "../../lib/types";
import { trackClick } from "../../lib/track";
import SmartImage from "../ui/SmartImage";
import styles from "./BannerCarousel.module.css";

const INTERVAL = 4000;

export default function BannerCarousel({ banners = [] }: { banners?: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const list = banners || [];
  const total = list.length;

  const go = useCallback((i: number) => setIndex(((i % total) + total) % total), [total]);

  useEffect(() => {
    if (total <= 1 || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % total), INTERVAL);
    return () => window.clearInterval(id);
  }, [total, paused]);

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
    setPaused(true);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current !== null) {
      const delta = e.changedTouches[0].clientX - touchStart.current;
      if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
    }
    touchStart.current = null;
    setPaused(false);
  }

  if (total === 0) return null;

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={{
            ["--slides" as string]: total,
            width: `${total * 100}%`,
            transform: `translate3d(-${(index * 100) / total}%, 0, 0)`,
          }}
        >
          {list.map((b, i) => {
            const img = (
              <SmartImage
                src={b.image_url}
                alt={b.title ?? "Banner"}
                className={`${styles.img} ${i === index ? styles.zoom : ""}`}
                loading="eager"
              />
            );
            return (
              <div key={b.id} className={styles.slide} aria-hidden={i !== index}>
                {b.link_url ? (
                  <a
                    href={b.link_url}
                    target={b.link_url.startsWith("/") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    onClick={() => trackClick("menu", "banner", b.id)}
                  >
                    {img}
                  </a>
                ) : (
                  img
                )}
                {b.title && <span className={styles.caption}>{b.title}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {total > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Slides">
          {list.map((b, i) => (
            <button
              key={b.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              className={`${styles.dot} ${i === index ? styles.active : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
