import Redis from 'redis'

const globalForRedis = globalThis as unknown as {
  redis: Redis.RedisClientType | undefined
}

export const redis = globalForRedis.redis ?? Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Connect to Redis
if (!redis.isOpen) {
  redis.connect().catch(console.error)
}