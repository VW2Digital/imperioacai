import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Link2, MousePointerClick, Users, UtensilsCrossed } from "lucide-react";
import { api } from "../../lib/http";
import { qk } from "../../lib/queries";
import type { InsightClick, InsightSurface, Insights } from "../../lib/types";
import { Button, Card, PageHeader } from "../../components/admin/ui";
import styles from "./Insights.module.css";

const RANGES = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

const TYPE_LABEL: Record<string, string> = {
  link: "Link",
  product: "Prato",
  banner: "Banner",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  maps: "Mapa",
  credit: "Crédito",
};

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

function formatDay(iso?: string) {
  if (!iso) return "";
  const parts = iso.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return iso;
  const [year, month, day] = parts;
  return new Date(year, (month ?? 1) - 1, day)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
}

function Chart({ series = [] }: { series?: InsightSurface["series"] }) {
  const list = series || [];
  const max = Math.max(1, ...list.map((point) => Math.max(point.visits || 0, point.clicks || 0)));
  const step = list.length > 60 ? 14 : list.length > 14 ? 5 : 1;

  return (
    <div className={styles.chart} role="img" aria-label="Visitas e cliques por dia">
      <div className={styles.chartScroll}>
        {list.map((point, index) => {
          const showLabel = index === list.length - 1 || index % step === 0;
          return (
            <div key={point.date} className={styles.day} title={`${formatDay(point.date)}: ${formatNumber(point.visits)} visitas, ${formatNumber(point.clicks)} cliques`}>
              <div className={styles.bars}>
                <span className={`${styles.bar} ${styles.barVisits}`} style={{ height: point.visits ? `${Math.max(6, (point.visits / max) * 100)}%` : 0 }} />
                <span className={`${styles.bar} ${styles.barClicks}`} style={{ height: point.clicks ? `${Math.max(6, (point.clicks / max) * 100)}%` : 0 }} />
              </div>
              <span className={styles.dayLabel} style={{ visibility: showLabel ? "visible" : "hidden" }}>
                {formatDay(point.date)}
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.legend}>
        <span><i className={styles.swatchVisits} /> Visitas</span>
        <span><i className={styles.swatchClicks} /> Cliques</span>
      </div>
    </div>
  );
}

function Ranking({ title, items = [] }: { title: string; items?: InsightClick[] }) {
  const list = items || [];
  const max = Math.max(1, ...list.map((item) => item.clicks || 0));
  return (
    <Card className={styles.ranking}>
      <h3>{title}</h3>
      {list.length === 0 ? (
        <p className={styles.empty}>Nenhum clique neste período.</p>
      ) : (
        <ul>
          {list.map((item) => {
            const typeName = TYPE_LABEL[item.target_type] ?? item.target_type;
            return (
              <li key={`${item.target_type}-${item.target_id ?? item.label}`}>
                <div className={styles.rankHead}>
                  <span className={styles.rankLabel}>
                    {typeName !== item.label && <small>{typeName}</small>}
                    {item.label}
                  </span>
                  <strong>{formatNumber(item.clicks)}</strong>
                </div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${(item.clicks / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function SurfaceBlock({
  title,
  hint,
  icon: Icon,
  data,
  children,
}: {
  title: string;
  hint: string;
  icon: typeof Link2;
  data?: InsightSurface;
  children?: ReactNode;
}) {
  if (!data) return null;
  const visits = data.visits || 0;
  const clicks = data.clicks || 0;
  const perVisit = visits > 0 ? clicks / visits : null;
  return (
    <section className={styles.surface}>
      <header className={styles.surfaceHead}>
        <span className={styles.surfaceIcon}>
          <Icon size={18} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{hint}</p>
        </div>
      </header>

      <div className={styles.metrics}>
        <div className={styles.metric} title="Uma visita por pessoa a cada 30 minutos">
          <Eye size={18} />
          <strong>{formatNumber(data.visits)}</strong>
          <span>Visitas</span>
        </div>
        <div className={styles.metric} title="Visitantes diferentes no período">
          <Users size={18} />
          <strong>{formatNumber(data.visitors)}</strong>
          <span>Pessoas</span>
        </div>
        <div className={styles.metric} title="Toques em links, pratos, banners e contatos">
          <MousePointerClick size={18} />
          <strong>{formatNumber(data.clicks)}</strong>
          <span>Cliques{perVisit === null ? "" : ` · ${perVisit.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} por visita`}</span>
        </div>
      </div>

      {children}

      <Card>
        <h3>Por dia</h3>
        {data.visits === 0 && data.clicks === 0 ? (
          <p className={styles.empty}>Ainda não há movimento neste período.</p>
        ) : (
          <Chart series={data.series} />
        )}
      </Card>
    </section>
  );
}

export default function InsightsPage() {
  const [range, setRange] = useState<RangeId>("7d");
  const insights = useQuery({
    queryKey: qk.insights(range),
    queryFn: () => api<Insights>(`/data/admin/insights?range=${range}`),
    placeholderData: (previous) => previous,
  });

  const data = insights.data;
  const dishes = data?.menu?.clicks_by_target?.filter((item) => item.target_type === "product") ?? [];
  const menuOther = data?.menu?.clicks_by_target?.filter((item) => item.target_type !== "product") ?? [];

  return (
    <div aria-busy={insights.isFetching}>
      <PageHeader
        title="Insights"
        subtitle="Visitas e cliques da árvore de links e do cardápio. Atualizar a página não conta de novo por 30 minutos."
        actions={
          <div className={styles.ranges} role="group" aria-label="Período">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={range === item.id ? styles.rangeOn : ""}
                aria-pressed={range === item.id}
                onClick={() => setRange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />

      {insights.isLoading && <p className={styles.status}>Carregando insights…</p>}

      {insights.isError && (
        <Card>
          <p className={styles.empty}>Não foi possível carregar os insights.</p>
          <Button variant="secondary" onClick={() => insights.refetch()}>
            Tentar novamente
          </Button>
        </Card>
      )}

      {data && (
        <>
          {data.links && (
            <SurfaceBlock
              title="Árvore de links"
              hint="Página inicial, com os botões e os ícones de contato."
              icon={Link2}
              data={data.links}
            >
              <Ranking title="Cliques" items={data.links.clicks_by_target ?? []} />
            </SurfaceBlock>
          )}

          {data.menu && (
            <SurfaceBlock
              title="Cardápio"
              hint="Página do cardápio: pratos abertos, banners e contatos."
              icon={UtensilsCrossed}
              data={data.menu}
            >
              <p className={styles.note}>
                O botão do cardápio na árvore de links foi clicado{" "}
                <strong>{formatNumber(data.link_to_menu ?? 0)}</strong>{" "}
                {(data.link_to_menu ?? 0) === 1 ? "vez" : "vezes"} neste período.
              </p>
              <div className={styles.split}>
                <Ranking title="Pratos mais abertos" items={dishes} />
                <Ranking title="Banners e contatos" items={menuOther} />
              </div>
            </SurfaceBlock>
          )}

          <p className={styles.footnote}>
            Quem está logado no painel não entra nesses números, para a navegação de quem administra não contar como visita.
          </p>
        </>
      )}
    </div>
  );
}
