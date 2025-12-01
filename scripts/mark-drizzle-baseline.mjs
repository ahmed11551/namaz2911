import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Client } from "pg";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set. Please add it to your .env.local.");
  process.exit(1);
}

const migrationTag = "0000_hot_preak";
const migrationFile = `drizzle/migrations/${migrationTag}.sql`;
const sqlSource = readFileSync(migrationFile, "utf8");
const hash = createHash("sha256").update(sqlSource).digest("hex");

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();

  await client.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
  await client.query(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  const existing = await client.query(
    'SELECT id FROM "drizzle"."__drizzle_migrations" WHERE hash = $1 LIMIT 1',
    [hash]
  );

  if (existing.rowCount === 0) {
    await client.query(
      'INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
      [hash, Date.now()]
    );
    console.log(`Baseline recorded for ${migrationTag}`);
  } else {
    console.log(`Baseline already recorded for ${migrationTag}`);
  }
} catch (error) {
  console.error("Failed to record baseline:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}

