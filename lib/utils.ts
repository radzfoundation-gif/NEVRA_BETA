import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiUrl() {
  let base = '';
  if (import.meta.env.VITE_API_BASE_URL) {
    base = import.meta.env.VITE_API_BASE_URL;
  } else if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      base = 'http://localhost:8788';
    } else {
      base = `http://${hostname}:8788`;
    }
  } else {
    base = 'http://localhost:8788';
  }
  // Normalize: trim trailing slash and accidental trailing /api
  // so callers can safely do `${getApiUrl()}/api/...` without doubling.
  return base.replace(/\/+$/, '').replace(/\/api$/, '');
}
