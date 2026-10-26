import { useQuery } from "@tanstack/react-query";
import { api } from "./http";
import type { LinkItem, MenuResponse, Settings } from "./types";

export const qk = {
  menu: ["menu"] as const,
  links: ["links"] as const,
  settings: ["settings"] as const,
  admin: (resource: string) => ["admin", resource] as const,
  stats: ["admin", "stats"] as const,
  insights: (range: string) => ["admin", "insights", range] as const,
};

export function useMenu() {
  return useQuery({ queryKey: qk.menu, queryFn: () => api<MenuResponse>("/data/menu") });
}

export function useLinks() {
  return useQuery({ queryKey: qk.links, queryFn: () => api<LinkItem[]>("/data/links") });
}

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: () => api<Settings>("/data/settings") });
}
