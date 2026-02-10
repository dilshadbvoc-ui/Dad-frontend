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
