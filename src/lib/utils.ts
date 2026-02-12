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
    const backendUrl = import.meta.env.VITE_API_URL || 'https://dad-backend.onrender.com';
    return `${backendUrl}${path}`;
}
