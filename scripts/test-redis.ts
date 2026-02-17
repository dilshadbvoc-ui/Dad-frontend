
import { redisClient } from '../src/config/redis';

async function testRedis() {
    console.log('Testing Redis connection...');
    try {
        await redisClient.set('test-key', 'Hello Redis');
        const value = await redisClient.get('test-key');
        console.log('Retrieved value:', value);

        if (value === 'Hello Redis') {
            console.log('Redis test PASSED!');
        } else {
            console.error('Redis test FAILED: Value mismatch');
        }

        await redisClient.del('test-key');
        process.exit(0);
    } catch (error) {
        console.error('Redis test FAILED:', error);
        process.exit(1);
    }
}

testRedis();
