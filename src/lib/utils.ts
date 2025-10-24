import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const defaultTimeZone =
  process.env.NEXT_PUBLIC_DEFAULT_TIME_ZONE ?? process.env.DEFAULT_TIME_ZONE ?? "America/Los_Angeles";

export function formatDateTime(value: Date | string, options?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: defaultTimeZone,
    ...options,
  }).format(date);
}
