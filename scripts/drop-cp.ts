import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const run = async () => {
  console.log("Dropping table cp_ladder_progress...");
  const sqlClient = postgres(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  await db.execute(sql`DROP TABLE IF EXISTS "cp_ladder_progress" CASCADE;`);

  console.log("Done.");
  process.exit(0);
};

run();
