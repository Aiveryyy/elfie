import type { ElvyxLog } from "@/types/elvyx";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function getLocalDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function compareLogsAscending(
  a: Pick<ElvyxLog, "dateLocal" | "daySequence" | "createdAt">,
  b: Pick<ElvyxLog, "dateLocal" | "daySequence" | "createdAt">,
) {
  if (a.dateLocal !== b.dateLocal) {
    return a.dateLocal.localeCompare(b.dateLocal);
  }

  if (a.daySequence !== b.daySequence) {
    return a.daySequence - b.daySequence;
  }

  return a.createdAt.localeCompare(b.createdAt);
}

export function compareLogsDescending(
  a: Pick<ElvyxLog, "dateLocal" | "daySequence" | "createdAt">,
  b: Pick<ElvyxLog, "dateLocal" | "daySequence" | "createdAt">,
) {
  return compareLogsAscending(b, a);
}

export function formatDateHeading(dateLocal: string) {
  const [year, month, day] = dateLocal.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTimeLabel(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function isWithinDateRange(
  dateLocal: string,
  startDate?: string,
  endDate?: string,
) {
  if (startDate && dateLocal < startDate) {
    return false;
  }

  if (endDate && dateLocal > endDate) {
    return false;
  }

  return true;
}

export function getRelativeDateLabel(
  dateLocal: string,
  today = getLocalDateString(),
) {
  if (dateLocal === today) {
    return "Today";
  }

  const current = new Date(`${today}T00:00:00`);
  const target = new Date(`${dateLocal}T00:00:00`);
  const diffDays = Math.round(
    (current.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return formatDateHeading(dateLocal);
}
