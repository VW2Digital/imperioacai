import {
  Clock,
  Globe,
  Instagram,
  Link as LinkIcon,
  MapPin,
  Phone,
  ShoppingBag,
  Star,
  Utensils,
  Facebook,
  type LucideProps,
} from "lucide-react";

export function WhatsAppIcon({ size = 20, ...rest }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M20.52 3.48A11.88 11.88 0 0 0 12.07 0C5.5 0 .15 5.35.15 11.93c0 2.1.55 4.15 1.6 5.95L.05 24l6.27-1.64a11.88 11.88 0 0 0 5.74 1.46h.01C18.65 23.82 24 18.47 24 11.9a11.82 11.82 0 0 0-3.48-8.42ZM12.07 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97 1-3.63-.24-.37a9.86 9.86 0 0 1-1.52-5.25c0-5.45 4.44-9.89 9.9-9.89a9.83 9.83 0 0 1 7 2.9 9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.86-9.91 9.86Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

export const LINK_ICONS: Record<string, { label: string; Icon: (p: LucideProps) => JSX.Element }> = {
  utensils: { label: "Cardápio", Icon: (p) => <Utensils {...p} /> },
  whatsapp: { label: "WhatsApp", Icon: (p) => <WhatsAppIcon size={typeof p.size === "number" ? p.size : 20} /> },
  instagram: { label: "Instagram", Icon: (p) => <Instagram {...p} /> },
  facebook: { label: "Facebook", Icon: (p) => <Facebook {...p} /> },
  "map-pin": { label: "Localização", Icon: (p) => <MapPin {...p} /> },
  phone: { label: "Telefone", Icon: (p) => <Phone {...p} /> },
  clock: { label: "Horário", Icon: (p) => <Clock {...p} /> },
  "shopping-bag": { label: "Delivery / iFood", Icon: (p) => <ShoppingBag {...p} /> },
  star: { label: "Avaliações", Icon: (p) => <Star {...p} /> },
  globe: { label: "Site", Icon: (p) => <Globe {...p} /> },
  link: { label: "Link", Icon: (p) => <LinkIcon {...p} /> },
};

export function LinkIconByName({ name, size = 20 }: { name: string | null | undefined; size?: number }) {
  const entry = LINK_ICONS[name ?? ""] ?? LINK_ICONS.link;
  return <entry.Icon size={size} />;
}
