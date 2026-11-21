const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function relTime(ts: number | null, now: number): string {
  if (ts === null) return "Sem registro";
  const diff = ts - now;
  const h = diff / 3_600_000;
  if (Math.abs(h) < 1) return rtf.format(Math.round(diff / 60_000), "minute");
  if (Math.abs(h) < 24) return rtf.format(Math.round(h), "hour");
  return rtf.format(Math.round(h / 24), "day");
}

export function hoursLabel(h: number): string {
  if (h <= 0) return "Pronto";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  const r = h % 24;
  return r ? `${d}d ${r}h` : `${d}d`;
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** yyyy-MM-ddTHH:mm in local time, for datetime-local inputs. */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
