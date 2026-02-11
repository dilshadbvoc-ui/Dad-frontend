import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Global currency store (simple module-level variable)
let currentCurrency = 'USD';

export function setGlobalCurrency(currency: string) {
    currentCurrency = currency;
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currentCurrency,
    }).format(amount)
}

/**
 * Helper to construct safe URL for assets (brochures, images, etc.)
 * Ensures URLs bypass React Router and go directly to backend
 */
export function getAssetUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // In development, always use localhost to avoid React Router conflicts
    if (import.meta.env.DEV) {
        return `http://localhost:5001${path}`;
    }

    // In production, construct full URL to backend
    const backendUrl = import.meta.env.VITE_API_URL || 'https://dad-backend.onrender.com';
    return `${backendUrl}${path}`;
}
