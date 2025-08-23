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


const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  family: 4,         // ✅ force IPv4
  keepAlive: true,   // ✅ maintain connection
});

pool.connect()
  .then(() => console.log("✅ Connected to Supabase PostgreSQL over IPv4"))
  .catch(err => console.error("❌ Database connection error:", err.message));
