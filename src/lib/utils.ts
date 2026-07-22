import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMAD(amount: number) {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(amount) + " MAD";
}

// Normalizes any input into a valid slug: lowercases, strips accents, replaces
// anything that isn't a-z/0-9 with hyphens. Used server-side so a person typing
// "Rabat" or "Yasmine Idrissi" into a slug field doesn't silently fail validation.
export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (é -> e, etc.)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

// Builds a wa.me deep link that opens a chat with a prefilled message.
// Strips everything but digits (wa.me needs the number with country code, no + or spaces).
export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
