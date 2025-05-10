// In-memory store for tracking unauthenticated views (use Redis in production)
// redisClient.js
const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Immediately connect the client
(async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis!');
  } catch (err) {
    console.error('Error connecting to Redis:', err);
  }
})();

module.exports = redisClient;