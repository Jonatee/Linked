const Redis = require("ioredis");
const env = require("../config/env");
const { logInfo, logError } = require("../config/logger");

const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 1,
  lazyConnect: true
});

async function connectRedis() {
  try {
    await redis.connect();
    logInfo("Redis connected");
  } catch (error) {
    logError("Redis connection failed", error.message);
  }
}

module.exports = {
  redis,
  connectRedis
};

