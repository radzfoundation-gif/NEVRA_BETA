import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiUrl() {
  // 1. Use environment variable if set (e.g. production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Dynamic resolution for local network (mobile testing)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If we're on localhost or 127.0.0.1, standard local dev
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8788';
    }
    // If we're on a network IP (e.g. 192.168.x.x), try to hit backend on same IP
    return `http://${hostname}:8788`;
  }

  // 3. Fallback default
  return 'http://localhost:8788';
}
