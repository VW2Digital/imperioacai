const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number | string | null | undefined): string {
  if (value == null || value === "") return brl.format(0);
  let n: number;
  if (typeof value === "number") {
    n = value;
  } else {
    const s = String(value).trim();
    if (s.includes(",")) {
      n = parseFloat(s.replace(/\./g, "").replace(",", "."));
    } else {
      n = parseFloat(s);
    }
  }
  return brl.format(Number.isFinite(n) ? n : 0);
}

export function whatsappLink(
  number: string | undefined,
  text = "Olá, Império Açaí! Gostaria de fazer um pedido.",
): string {
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

/** Imagem de fallback com a logo oficial do Império Açaí quando uma imagem falha ou não foi cadastrada. */
export const FALLBACK_IMAGE = "/placeholder.png";
export const LOGO_IMAGE = "/logo.png";
