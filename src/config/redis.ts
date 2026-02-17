import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('Initializing Redis client with URL:', REDIS_URL);

export const redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1, // Fail fast if Redis is down
    enableReadyCheck: false,
    connectTimeout: 5000, // 5 seconds timeout
    lazyConnect: true, // Don't connect immediately on instantiation
    retryStrategy: (times) => {
        if (times > 3) { // Stop retrying after 3 attempts
            console.warn('Redis connection failed too many times. Disabling Redis features.');
            return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

// Attempt connection but don't crash if it fails
redisClient.connect().catch(err => {
    console.warn('Failed to connect to Redis on startup:', err.message);
});

redisClient.on('connect', () => {
    console.log('Redis client connected');
});

redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
});

export default redisClient;
