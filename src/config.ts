// Helper to sanitize URL (remove trailing slash and /api suffix)
const sanitizeUrl = (url: string) => {
    return url.replace(/\/$/, '').replace(/\/api$/, '');
};

export const API_URL = sanitizeUrl(import.meta.env.VITE_API_URL || 'http://localhost:5001');
