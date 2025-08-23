// const { Pool } = require('pg');
// require('dotenv').config({ path: './config.env' });

// // Prefer a single DATABASE_URL (e.g., Supabase) when provided; otherwise use granular settings
// let poolConfig;

// if (process.env.DATABASE_URL) {
//   // Supabase requires SSL; use a permissive setting suitable for managed certs
//   poolConfig = {
//     connectionString: process.env.DATABASE_URL,
//     ssl: { rejectUnauthorized: false },
//     max: 20,
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 5000,
//   };
// } else {
//   // Build connection options allowing password-less local auth when DB_PASSWORD is empty
//   poolConfig = {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
//     database: process.env.DB_NAME,
//     user: process.env.DB_USER,
//     max: 20,
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 2000,
//   };

//   if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '') {
//     poolConfig.password = process.env.DB_PASSWORD;
//   }

//   // Enable SSL for managed Postgres providers like Supabase when requested
//   if ((process.env.DB_SSL || '').toLowerCase() === 'true') {
//     poolConfig.ssl = { rejectUnauthorized: false };
//   }
// }

// const pool = new Pool(poolConfig);

// // Test the connection
// pool.on('connect', () => {
//   console.log('Connected to PostgreSQL database');
// });

// pool.on('error', (err) => {
//   console.error('Unexpected error on idle client', err);
//   process.exit(-1);
// });

// module.exports = pool;


const { Client } = require('pg');
require('dotenv').config({ path: './config.env' });

const client = new Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  host: process.env.DB_HOST, // e.g. aws-0-ap-southeast-1.pooler.supabase.com
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  family: 4, // ✅ force IPv4 only
});

client.connect()
  .then(() => {
    console.log("✅ Connected to PostgreSQL over IPv4");
  })
  .catch((error) => {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  });

module.exports = client;