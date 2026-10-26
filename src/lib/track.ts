/**
 * Registra visita ou clique na arvore de links e no cardapio.
 * Falha em silencio: medicao nunca deve atrapalhar a navegacao.
 */

export type Surface = "links" | "menu";

const STORAGE_KEY = "ns_vid";
let memoryId: string | null = null;
const recent = new Map<string, number>();

function shouldSend(key: string, windowMs: number) {
  const now = Date.now();
  if (now - (recent.get(key) ?? 0) < windowMs) return false;
  recent.set(key, now);
  return true;
}

function visitorId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
    const id = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    memoryId ??= crypto.randomUUID().replace(/-/g, "");
    return memoryId;
  }
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify({ visitor_id: visitorId(), ...payload });
  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/data/track", blob)) return;
    }
  } catch {
    /* tenta o fetch abaixo */
  }
  fetch("/data/track", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {});
}

export function trackView(surface: Surface) {
  if (!shouldSend(`view:${surface}`, 30 * 60 * 1000)) return;
  send({ surface, kind: "view", target_type: "page" });
}

export function trackClick(
  surface: Surface,
  targetType: "link" | "product" | "banner" | "whatsapp" | "instagram" | "maps" | "credit",
  targetId?: number
) {
  const key = `click:${surface}:${targetType}:${targetId ?? ""}`;
  if (!shouldSend(key, 3000)) return;
  send({
    surface,
    kind: "click",
    target_type: targetType,
    target_id: targetId ?? null,
  });
}
