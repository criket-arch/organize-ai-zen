import type { Task } from "@/types/task";
import { formatLocalDate, formatLocalTime } from "@/lib/dateTime";

const unfoldIcs = (text: string) => text.replace(/\r?\n[ \t]/g, "");
const getField = (block: string, name: string) => {
  const match = new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, "im").exec(block);
  return match?.[1]?.trim();
};

const normalizeIcsText = (value: string) =>
  value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\:/g, ":");

const parseIcsDate = (value: string | undefined): Date | null => {
  if (!value) return null;

  const dateOnlyMatch = /^\d{8}$/.exec(value);
  if (dateOnlyMatch) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return new Date(year, month, day);
  }

  const dateTimeMatch = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(value);
  if (!dateTimeMatch) return null;

  const [, year, month, day, hour, minute, second, zone] = dateTimeMatch;
  if (zone === "Z") {
    return new Date(Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ));
  }

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
};

const formatDate = (date: Date) => formatLocalDate(date);
const formatTime = (date: Date) => formatLocalTime(date);

export type ImportedTask = Omit<Task, "id" | "createdAt">;

export const parseGoogleCalendarICS = (raw: string): ImportedTask[] => {
  const unfolded = unfoldIcs(raw);
  const matches = [...unfolded.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi)];

  return matches.map((match) => {
    const block = match[1];
    const summary = getField(block, "SUMMARY") ?? "Untitled event";
    const description = normalizeIcsText(getField(block, "DESCRIPTION") ?? "");
    const location = normalizeIcsText(getField(block, "LOCATION") ?? "");
    const startRaw = getField(block, "DTSTART");
    const endRaw = getField(block, "DTEND");
    const startDate = parseIcsDate(startRaw ?? undefined);
    const endDate = parseIcsDate(endRaw ?? undefined);

    if (!startDate) return null;

    const allDay = /^[0-9]{8}$/.test(startRaw ?? "");
    const date = formatDate(startDate);
    const time = allDay ? undefined : formatTime(startDate);
    const duration = endDate && !allDay
      ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
      : undefined;

    return {
      title: normalizeIcsText(summary),
      description: description || undefined,
      date,
      time,
      duration,
      location: location || undefined,
      priority: "medium" as const,
      tags: ["google-calendar"],
      completed: false,
    };
  }).filter((task): task is ImportedTask => task !== null && !!task.title);
};
