const redis = require('redis');
require('dotenv').config({ path: './config.env' });

// Support Redis v4 connection options and make connection optional
const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

let client;

const redisEnabled = String(process.env.REDIS_ENABLED || '').toLowerCase() === 'true';

try {
  if (!redisEnabled || (!redisUrl && !redisHost)) {
    // Redis not configured; export a disabled mock client with isOpen=false
    client = {
      isOpen: false,
      async connect() {},
      async quit() {},
      async get() { return null; },
      async setEx() { return 'OK'; },
      async del() { return 0; },
      async keys() { return []; },
      async exists() { return 0; },
      on() {}
    };
    console.log('Redis disabled or not configured. Caching is disabled.');
  } else {
    client = redis.createClient(
      redisUrl
        ? { url: redisUrl }
        : { socket: { host: redisHost, port: redisPort }, password: redisPassword }
    );

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('ready', () => {
      console.log('Redis client ready');
    });

    // Connect asynchronously at startup
    client.connect()
      .then(() => console.log('Connected to Redis'))
      .catch((err) => console.error('Failed to connect to Redis:', err));
  }
} catch (err) {
  console.error('Redis initialization error:', err);
  // Fallback to disabled client
  client = {
    isOpen: false,
    async connect() {},
    async quit() {},
    async get() { return null; },
    async setEx() { return 'OK'; },
    async del() { return 0; },
    async keys() { return []; },
    async exists() { return 0; },
    on() {}
  };
}

module.exports = client;
