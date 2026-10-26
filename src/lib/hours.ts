export const WEEK = [
  { id: "mon", label: "Segunda" },
  { id: "tue", label: "Terça" },
  { id: "wed", label: "Quarta" },
  { id: "thu", label: "Quinta" },
  { id: "fri", label: "Sexta" },
  { id: "sat", label: "Sábado" },
  { id: "sun", label: "Domingo" },
] as const;

export type DayId = (typeof WEEK)[number]["id"];

export interface DayHours {
  day: DayId;
  closed: boolean;
  open: string;
  close: string;
  open2: string;
  close2: string;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

function cleanTime(value: unknown) {
  if (typeof value !== "string" || !TIME.test(value)) return "";
  return value.slice(0, 5);
}

export function blankWeek(): DayHours[] {
  return WEEK.map((day) => ({ day: day.id, closed: false, open: "", close: "", open2: "", close2: "" }));
}

export function parseSchedule(raw: string | undefined | null): DayHours[] {
  const base = blankWeek();
  if (!raw) return base;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return base;
  }
  if (!Array.isArray(data)) return base;

  const byDay = new Map<string, DayHours>();
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DayHours>;
    if (!WEEK.some((day) => day.id === row.day)) continue;
    byDay.set(row.day as string, {
      day: row.day as DayId,
      closed: Boolean(row.closed),
      open: cleanTime(row.open),
      close: cleanTime(row.close),
      open2: cleanTime(row.open2),
      close2: cleanTime(row.close2),
    });
  }

  return base.map((day) => byDay.get(day.day) ?? day);
}

function hasRange(open: string, close: string) {
  return open !== "" && close !== "";
}

export function hasSchedule(days: DayHours[]) {
  return days.some((day) => day.closed || hasRange(day.open, day.close) || hasRange(day.open2, day.close2));
}

export function formatTime(value: string) {
  const [hour, minute] = value.split(":");
  const h = Number(hour) === 0 ? "00" : String(Number(hour));
  if (!minute || minute === "00") return `${h}h`;
  return `${h}h${minute}`;
}

export function formatRange(open: string, close: string) {
  return `${formatTime(open)} às ${formatTime(close)}`;
}

export function formatHours(day: DayHours) {
  if (day.closed) return "Fechado";
  const parts = [
    hasRange(day.open, day.close) ? formatRange(day.open, day.close) : "",
    hasRange(day.open2, day.close2) ? formatRange(day.open2, day.close2) : "",
  ].filter(Boolean);
  return parts.join(" - ");
}

const SHORT: Record<DayId, string> = {
  mon: "Seg",
  tue: "Ter",
  wed: "Qua",
  thu: "Qui",
  fri: "Sex",
  sat: "Sáb",
  sun: "Dom",
};

export interface HoursGroup {
  label: string;
  hours: string;
  includesToday: boolean;
}

function isListed(day: DayHours) {
  return day.closed || hasRange(day.open, day.close) || hasRange(day.open2, day.close2);
}

function rangeLabel(days: DayHours[]) {
  if (!days || days.length === 0) return "";
  const full = WEEK.find((item) => item.id === days[0].day)?.label ?? days[0].day;
  if (days.length === 1) return full;
  const start = SHORT[days[0].day];
  const end = SHORT[days[days.length - 1].day].toLowerCase();
  return days.length === 2 ? `${start} e ${end}` : `${start} a ${end}`;
}

/** Junta dias seguidos com o mesmo horário: "Ter a sáb". */
export function summarizeSchedule(days: DayHours[], today: DayId): HoursGroup[] {
  const groups: { days: DayHours[]; hours: string }[] = [];
  days.filter(isListed).forEach((day, index, listed) => {
    const hours = formatHours(day);
    const previous = listed[index - 1];
    const last = groups[groups.length - 1];
    const follows = previous && WEEK.findIndex((item) => item.id === day.day) - WEEK.findIndex((item) => item.id === previous.day) === 1;
    if (last && last.hours === hours && follows) {
      last.days.push(day);
      return;
    }
    groups.push({ days: [day], hours });
  });

  return groups.map((group) => ({
    label: rangeLabel(group.days),
    hours: group.hours,
    includesToday: group.days.some((day) => day.day === today),
  }));
}

export function todayId(now = new Date()): DayId {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/Sao_Paulo",
  }).format(now);
  const map: Record<string, DayId> = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  };
  return map[weekday] ?? "mon";
}

function covers(time: string, open: string, close: string) {
  if (!open || !close || open === close) return false;
  if (close > open) return time >= open && time < close;
  return time >= open || time < close;
}

export function isOpenNow(day: DayHours | undefined, now = new Date()) {
  if (!day || day.closed) return false;
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Sao_Paulo",
  }).format(now);
  return covers(time, day.open, day.close) || covers(time, day.open2, day.close2);
}
