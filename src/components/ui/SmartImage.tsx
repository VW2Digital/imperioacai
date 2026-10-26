import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { FALLBACK_IMAGE } from "../../lib/format";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null };

/** <img> com fallback automatico quando a URL nao carrega. */
export default function SmartImage({ src, alt = "", ...rest }: Props) {
  const [current, setCurrent] = useState(src || FALLBACK_IMAGE);

  useEffect(() => {
    setCurrent(src || FALLBACK_IMAGE);
  }, [src]);

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      loading={rest.loading ?? "lazy"}
      decoding="async"
      onError={() => current !== FALLBACK_IMAGE && setCurrent(FALLBACK_IMAGE)}
    />
  );
}
