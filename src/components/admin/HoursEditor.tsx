import { WEEK, blankWeek, parseSchedule, type DayHours } from "../../lib/hours";
import { Input } from "./ui";
import styles from "./HoursEditor.module.css";

export default function HoursEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const days = value ? parseSchedule(value) : blankWeek();

  function update(next: DayHours[]) {
    onChange(JSON.stringify(next));
  }

  function patch(day: DayHours["day"], change: Partial<DayHours>) {
    update(days.map((item) => (item.day === day ? { ...item, ...change } : item)));
  }

  return (
    <div className={styles.week}>
      <div className={styles.head} aria-hidden="true">
        <span />
        <span />
        <span>1º turno</span>
        <span>2º turno</span>
      </div>
      {days.map((day) => {
        const label = WEEK.find((item) => item.id === day.day)?.label ?? day.day;
        return (
          <div key={day.day} className={styles.row}>
            <strong>{label}</strong>
            <label className={styles.closed}>
              <input
                type="checkbox"
                checked={day.closed}
                onChange={(event) => patch(day.day, { closed: event.target.checked })}
              />
              Fechado
            </label>
            <div className={styles.shift}>
              <span className={styles.shiftLabel}>1º turno</span>
              <Input
                type="time"
                aria-label={`${label}, primeiro turno, abre`}
                value={day.open}
                disabled={day.closed}
                onChange={(event) => patch(day.day, { open: event.target.value })}
              />
              <span className={styles.to}>às</span>
              <Input
                type="time"
                aria-label={`${label}, primeiro turno, fecha`}
                value={day.close}
                disabled={day.closed}
                onChange={(event) => patch(day.day, { close: event.target.value })}
              />
            </div>
            <div className={styles.shift}>
              <span className={styles.shiftLabel}>2º turno</span>
              <Input
                type="time"
                aria-label={`${label}, segundo turno, abre`}
                value={day.open2}
                disabled={day.closed}
                onChange={(event) => patch(day.day, { open2: event.target.value })}
              />
              <span className={styles.to}>às</span>
              <Input
                type="time"
                aria-label={`${label}, segundo turno, fecha`}
                value={day.close2}
                disabled={day.closed}
                onChange={(event) => patch(day.day, { close2: event.target.value })}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
