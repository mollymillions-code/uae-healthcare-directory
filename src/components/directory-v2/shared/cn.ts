import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware class merger. Import everywhere in directory-v2. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
