import { Clock } from "lucide-react";
import type { Settings } from "../../lib/types";
import { hasSchedule, isOpenNow, parseSchedule, summarizeSchedule, todayId } from "../../lib/hours";
import styles from "./HoursSection.module.css";

export default function HoursSection({ settings }: { settings: Settings }) {
  const days = parseSchedule(settings.opening_schedule);
  if (!hasSchedule(days)) return null;

  const today = todayId();
  const groups = summarizeSchedule(days, today);
  const todayRow = days.find((day) => day.day === today && (day.closed || day.open || day.open2));
  const open = isOpenNow(todayRow);

  return (
    <section className={`container ${styles.section}`} aria-labelledby="hours-title">
      <div className={styles.card}>
        <header className={styles.head}>
          <h2 id="hours-title">
            <Clock size={18} /> Horários
          </h2>
          {todayRow && <span className={open ? styles.open : styles.closed}>{open ? "Aberto agora" : "Fechado agora"}</span>}
        </header>

        <ul className={styles.days}>
          {groups.map((group) => (
            <li key={group.label} className={group.includesToday ? styles.today : ""}>
              <span>
                {group.label}
                {group.includesToday && <small>Hoje</small>}
              </span>
              <strong>{group.hours}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
