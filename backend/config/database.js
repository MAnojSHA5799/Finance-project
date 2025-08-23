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


// server.js
import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const app = express();
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// DB Test Route
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

