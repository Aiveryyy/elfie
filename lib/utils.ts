import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural?: string,
) {
  const suffix = count === 1 ? singular : (plural ?? `${singular}s`);

  return `${count} ${suffix}`;
}

export function sentenceCase(value: string) {
  if (!value.length) {
    return value;
  }

  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

export function truncate(value: string, max: number) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
}
