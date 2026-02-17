import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis';

// Helper to create Redis store
const createRedisStore = () => new RedisStore({
    // @ts-expect-error - Valid ioredis call signature that mismatches strict types
    sendCommand: (...args: string[]) => redisClient.call(...args),
});

// General API rate limiting
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    }
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    store: createRedisStore(),
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    }
});

// WhatsApp API rate limiting (more restrictive)
export const whatsappLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 80, // WhatsApp allows 80 messages per minute per phone number
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(),
    message: {
        error: 'WhatsApp rate limit exceeded. Maximum 80 messages per minute.',
        retryAfter: '1 minute'
    }
});

// Meta API rate limiting
export const metaLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // Meta API allows 200 calls per hour per app
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(),
    message: {
        error: 'Meta API rate limit exceeded. Maximum 200 calls per hour.',
        retryAfter: '1 hour'
    }
});

// Webhook rate limiting (prevent DoS attacks)
export const webhookLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Allow 100 webhook calls per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(),
    message: {
        error: 'Webhook rate limit exceeded.',
        retryAfter: '1 minute'
    }
});

// Campaign sending rate limiting
export const campaignLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Maximum 10 campaigns per hour per organization
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(),
    message: {
        error: 'Campaign rate limit exceeded. Maximum 10 campaigns per hour.',
        retryAfter: '1 hour'
    }
});