const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return brl.format(Number.isFinite(n) ? n : 0);
}

export function whatsappLink(number: string | undefined, text?: string): string {
  const digits = (number ?? "").replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Imagem de fallback (SVG inline) quando a URL falha. */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675">
  <rect width="900" height="675" fill="#f3efec"/>
  <circle cx="450" cy="300" r="78" fill="#e8d9d9"/>
  <path d="M394 333l42-47 38 39 28-29 63 72H335z" fill="#8a1c1c" opacity=".7"/>
  <text x="450" y="440" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#8a8a8a">Imagem indisponível</text>
</svg>`);
