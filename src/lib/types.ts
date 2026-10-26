export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_new: boolean;
  sort_order: number;
  active: boolean;
  category_name?: string;
  category_slug?: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  active: boolean;
  products_count?: number;
}

export interface MenuCategory {
  id: number;
  slug: string;
  name: string;
  image_url: string | null;
  products: Pick<Product, "id" | "name" | "description" | "price" | "image_url" | "is_new">[];
}

export type MenuProduct = MenuCategory["products"][number];

export interface Banner {
  id: number;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  active: boolean;
}

export interface LinkItem {
  id: number;
  label: string;
  url: string;
  icon: string | null;
  is_primary: boolean;
  sort_order: number;
  active: boolean;
}

export type Settings = Partial<
  Record<
    | "site_name"
    | "tagline"
    | "logo_url"
    | "whatsapp_number"
    | "whatsapp_display"
    | "instagram_handle"
    | "address"
    | "maps_url"
    | "maps_embed_url"
    | "opening_hours"
    | "opening_schedule"
    | "new_arrivals_title"
    | "footer_credit_label"
    | "footer_credit_url"
    | "primary_color",
    string
  >
>;

export interface MenuResponse {
  categories: MenuCategory[];
  banners: Banner[];
  settings: Settings;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface InsightPoint {
  date: string;
  visits: number;
  visitors: number;
  clicks: number;
}

export interface InsightClick {
  target_type: string;
  target_id: number | null;
  label: string;
  clicks: number;
}

export interface InsightSurface {
  visits: number;
  visitors: number;
  clicks: number;
  series: InsightPoint[];
  clicks_by_target: InsightClick[];
}

export interface Insights {
  range: "today" | "7d" | "30d" | "90d";
  from: string;
  to: string;
  link_to_menu: number;
  links: InsightSurface;
  menu: InsightSurface;
}

export interface Stats {
  products: number;
  products_active: number;
  products_new: number;
  categories: number;
  banners: number;
  links: number;
  by_category: { id: number; name: string; total: number }[];
}
