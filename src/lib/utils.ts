import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add number formatting utility
export function formatNumberWithCommas(num: number): string {
  // Remove any fraction if .00; keep up to two decimals otherwise
  const [integer, fraction] = num.toFixed(2).split('.');
  // Use a regular expression for thousands commas
  const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === "00" ? withCommas : `${withCommas}.${fraction}`;
}
