const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

// Prefer a single DATABASE_URL (e.g., Supabase) when provided; otherwise use granular settings
let poolConfig;


  // Build connection options allowing password-less local auth when DB_PASSWORD is empty
  poolConfig = {
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

  if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
    poolConfig.password = process.env.DB_PASSWORD;
  }

  // Enable SSL for managed Postgres providers like Supabase when requested
  if ((process.env.DB_SSL || '').toLowerCase() === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }


const pool = new Pool(poolConfig);

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
