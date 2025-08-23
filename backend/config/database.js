const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  family: 4,        // ✅ force IPv4 only
  keepAlive: true,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(poolConfig);

// Explicit test query to ensure connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
})();

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
