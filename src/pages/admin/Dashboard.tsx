import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Image as ImageIcon, Link2, Sparkles, Tags, Utensils } from "lucide-react";
import { api } from "../../lib/http";
import { qk } from "../../lib/queries";
import type { Stats } from "../../lib/types";
import { Card, PageHeader } from "../../components/admin/ui";
import styles from "./Dashboard.module.css";

export default function DashboardPage() {
  const stats = useQuery({ queryKey: qk.stats, queryFn: () => api<Stats>("/data/admin/stats") });
  const s = stats.data;

  const cards = [
    { to: "/admin/pratos", label: "Pratos ativos", value: s ? `${s.products_active}/${s.products}` : "—", icon: Utensils },
    { to: "/admin/pratos", label: "Marcados como novidade", value: s?.products_new ?? "—", icon: Sparkles },
    { to: "/admin/categorias", label: "Categorias", value: s?.categories ?? "—", icon: Tags },
    { to: "/admin/banners", label: "Banners ativos", value: s?.banners ?? "—", icon: ImageIcon },
    { to: "/admin/links", label: "Links ativos", value: s?.links ?? "—", icon: Link2 },
  ];

  const max = Math.max(1, ...(s?.by_category?.map((c) => c.total) ?? [1]));

  return (
    <>
      <PageHeader title="Visão geral" subtitle="Resumo do cardápio digital" />

      <div className={styles.grid}>
        {cards.map(({ to, label, value, icon: Icon }) => (
          <Link key={label} to={to} className={styles.stat}>
            <span className={styles.icon}>
              <Icon size={20} />
            </span>
            <strong>{value}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <Card className={styles.chart}>
        <h2>Pratos ativos por categoria</h2>
        {s?.by_category?.map((c) => (
          <div key={c.id} className={styles.bar}>
            <span>{c.name}</span>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${(c.total / max) * 100}%` }} />
            </div>
            <strong>{c.total}</strong>
          </div>
        ))}
      </Card>
    </>
  );
}
