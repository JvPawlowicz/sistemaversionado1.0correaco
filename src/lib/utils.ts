
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEFAULT_AVATAR_URL = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3e%3ccircle cx='12' cy='7' r='4'/%3e%3c/svg%3e";
export const OLD_PLACEHOLDER_URL = 'https://placehold.co/400x400.png';

export function getDisplayAvatarUrl(url?: string | null): string {
  if (!url || url === OLD_PLACEHOLDER_URL) {
    return DEFAULT_AVATAR_URL;
  }
  return url;
}
