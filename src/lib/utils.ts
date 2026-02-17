import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Currency symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    JPY: '¥',
    CNY: '¥',
    KRW: '₩',
    BRL: 'R$',
    MXN: '$',
    ZAR: 'R',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    THB: '฿',
    IDR: 'Rp',
    MYR: 'RM',
    PHP: '₱',
    VND: '₫',
    TRY: '₺',
    RUB: '₽',
    SAR: 'ر.س',
    QAR: 'ر.ق',
    KWD: 'د.ك',
    BHD: 'د.ب',
    OMR: 'ر.ع',
    NZD: 'NZ$',
    HKD: 'HK$',
    TWD: 'NT$',
};

// Locale mapping for proper number formatting
const CURRENCY_LOCALES: Record<string, string> = {
    USD: 'en-US',
    INR: 'en-IN',
    EUR: 'de-DE',
    GBP: 'en-GB',
    AED: 'ar-AE',
    AUD: 'en-AU',
    CAD: 'en-CA',
    SGD: 'en-SG',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    KRW: 'ko-KR',
    BRL: 'pt-BR',
    MXN: 'es-MX',
    ZAR: 'en-ZA',
    CHF: 'de-CH',
    SEK: 'sv-SE',
    NOK: 'nb-NO',
    DKK: 'da-DK',
    PLN: 'pl-PL',
    THB: 'th-TH',
    IDR: 'id-ID',
    MYR: 'ms-MY',
    PHP: 'en-PH',
    VND: 'vi-VN',
    TRY: 'tr-TR',
    RUB: 'ru-RU',
    SAR: 'ar-SA',
    QAR: 'ar-QA',
    KWD: 'ar-KW',
    BHD: 'ar-BH',
    OMR: 'ar-OM',
    NZD: 'en-NZ',
    HKD: 'zh-HK',
    TWD: 'zh-TW',
};

// Global currency store (simple module-level variable)
let currentCurrency = 'USD';

export function setGlobalCurrency(currency: string) {
    currentCurrency = currency.toUpperCase();
}

export function getGlobalCurrency() {
    return currentCurrency;
}

export function getCurrencySymbol(currency?: string): string {
    const curr = (currency || currentCurrency).toUpperCase();
    return CURRENCY_SYMBOLS[curr] || curr;
}

export function formatCurrency(amount: number, currency?: string, options?: {
    compact?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}) {
    const curr = (currency || currentCurrency).toUpperCase();
    const locale = CURRENCY_LOCALES[curr] || 'en-US';

    // Determine fraction digits with proper defaults
    const isCompact = options?.compact ?? false;
    const maxFractionDigits = options?.maximumFractionDigits ?? (isCompact ? 0 : 2);
    const minFractionDigits = options?.minimumFractionDigits ?? (isCompact ? 0 : Math.min(maxFractionDigits, 2));

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr,
        notation: isCompact ? 'compact' : 'standard',
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits,
    }).format(amount);
}

export function formatCurrencyCompact(amount: number, currency?: string) {
    return formatCurrency(amount, currency, { compact: true, maximumFractionDigits: 1 });
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
    // If VITE_API_URL contains /api, we need to strip it for static assets which are at root /uploads
    const apiUrl = (import.meta.env.VITE_API_URL || 'https://pypecrm.com').replace(/\/$/, ''); // Remove trailing slash if present
    const baseUrl = apiUrl.endsWith('/api')
        ? apiUrl.slice(0, -4)
        : apiUrl;

    return `${baseUrl}${path}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for non-secure contexts (HTTP)
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                textArea.remove();
                return true;
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
                textArea.remove();
                return false;
            }
        }
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    }
}

/**
 * Safely retrieves and parses user info from localStorage
 */
export function getUserInfo() {
    try {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    } catch (e) {
        console.error("Failed to parse user info", e);
        return null;
    }
}

/**
 * Robust role checking helper that handles both string and object-based roles,
 * and is case-insensitive.
 */
export function checkRole(user: any, targetRoles: string | string[]): boolean {
    if (!user || !user.role) return false;

    // Normalize user role to a lowercase string, replacing spaces and hyphens with underscores
    const userRoleStr = (typeof user.role === 'object'
        ? (user.role.name || '')
        : String(user.role)).toLowerCase().replace(/[\s-]/g, '_');

    const targets = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
    return targets.some(target => {
        const normalizedTarget = target.toLowerCase().replace(/[\s-]/g, '_');
        return normalizedTarget === userRoleStr;
    });
}

/**
 * Checks if a user has administrative privileges (Admin or Super Admin)
 */
export function isAdmin(user: any): boolean {
    return checkRole(user, ['admin', 'super_admin']);
}

/**
 * Checks if a user is a Super Admin
 */
export function isSuperAdmin(user: any): boolean {
    return checkRole(user, 'super_admin');
}
