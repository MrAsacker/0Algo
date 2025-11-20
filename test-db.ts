import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    // Fetch all tables in the public schema
    const res = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    console.log("✅ Connected successfully! Tables in your database:");
    res.rows.forEach((row) => console.log("-", row.tablename));
  } catch (err) {
    console.error("❌ Connection failed:", err);
  } finally {
    pool.end();
  }
})();
