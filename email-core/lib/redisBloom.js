import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  db: parseInt(process.env.REDIS_DB || "0", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const redis = new Redis(redisConfig);

redis.on("error", (err) => {
  console.error("❌ Redis Bloom Connection Error:", err.message);
});

let useBloom = null; // caches support detection (null = undetermined)

/**
 * Checks if the Redis server supports the RedisBloom module (BF.ADD command)
 */
async function detectBloomSupport() {
  if (useBloom !== null) return useBloom;

  try {
    // Try to execute a test BF.EXISTS on a dummy key
    await redis.call("BF.EXISTS", "test_bloom_support_key", "test_value");
    useBloom = true;
    console.log("✅ Redis BloomFilter support detected.");
  } catch (err) {
    if (err.message.includes("unknown command") || err.message.includes("ERR unknown command")) {
      useBloom = false;
      console.warn("⚠️ Redis BloomFilter module not loaded. Falling back to standard Redis Sets.");
    } else {
      // Other error (e.g., connection timed out) - do not cache, but fallback for now
      return false;
    }
  }
  return useBloom;
}

/**
 * Adds a value to a Bloom filter (or fallback Set)
 * @param {string} filterKey - The key of the filter/set
 * @param {string} value - The email/value to add
 * @returns {Promise<boolean>} True if added, false if already present (or on fallback)
 */
export async function addToBloom(filterKey, value) {
  const cleanVal = String(value || "").trim().toLowerCase();
  if (!cleanVal) return false;

  const isBloomSupported = await detectBloomSupport();

  try {
    if (isBloomSupported) {
      // BF.ADD returns 1 if item was newly added, 0 if it might already be present
      const res = await redis.call("BF.ADD", filterKey, cleanVal);
      return res === 1;
    } else {
      // Fallback: Use standard Redis Sets
      const res = await redis.sadd(filterKey, cleanVal);
      return res === 1;
    }
  } catch (err) {
    console.error(`Error adding to filter ${filterKey}:`, err.message);
    return false;
  }
}

/**
 * Checks if a value exists in a Bloom filter (or fallback Set)
 * @param {string} filterKey - The key of the filter/set
 * @param {string} value - The email/value to check
 * @returns {Promise<boolean>} True if present, false otherwise
 */
export async function checkBloom(filterKey, value) {
  const cleanVal = String(value || "").trim().toLowerCase();
  if (!cleanVal) return false;

  const isBloomSupported = await detectBloomSupport();

  try {
    if (isBloomSupported) {
      // BF.EXISTS returns 1 if item exists (with false positive probability), 0 if not
      const res = await redis.call("BF.EXISTS", filterKey, cleanVal);
      return res === 1;
    } else {
      // Fallback: Check standard Redis Set membership
      const res = await redis.sismember(filterKey, cleanVal);
      return res === 1;
    }
  } catch (err) {
    console.error(`Error checking filter ${filterKey}:`, err.message);
    return false; // Safely assume not suppressed if DB call fails
  }
}

export default redis;
