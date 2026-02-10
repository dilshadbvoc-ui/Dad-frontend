// Helper to sanitize URL (remove trailing slash and /api suffix)
const sanitizeUrl = (url: string) => {
    return url.replace(/\/$/, '').replace(/\/api$/, '');
};

export const API_URL = sanitizeUrl(import.meta.env.VITE_API_URL || 'http://localhost:5001');

// Debuging logic for production URL issues


if (API_URL.includes('null')) {
    console.error('CRITICAL: API_URL contains "null". This indicates a configuration error.');
}
