const Redis = require("ioredis");
const env = require("../config/env");
const { logInfo, logError } = require("../config/logger");

const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 1,
  lazyConnect: true
});

let connected = false;

async function connectRedis() {
  if (connected) {
    return;
  }

  try {
    await redis.connect();
    connected = true;
    logInfo("Redis connected");
  } catch (error) {
    logError("Redis connection failed", error.message);
  }
}

async function closeRedis() {
  if (!connected) {
    return;
  }

  connected = false;
  await redis.quit();
}

module.exports = {
  redis,
  connectRedis,
  closeRedis
};
