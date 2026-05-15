/**
 * Run generated SQL batch files via Supabase REST (needs service role in .env.local).
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const batchDir = join(dir, "sql-batches");

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

async function runSql(query) {
  const res = await fetch(`${url}/rest/v1/rpc`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  // Use pg meta / direct SQL not available on REST — use postgrest not ideal for raw SQL
  void res;
}

// Use Supabase JS rpc - actually raw SQL needs management API or postgres connection
// Fall back: @supabase/supabase-js doesn't run raw SQL. Use fetch to SQL endpoint if enabled.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function execViaPg(query) {
  const { data, error } = await supabase.rpc("exec_sql", { query_text: query });
  if (error) throw error;
  return data;
}

async function main() {
  const files = ["fgsea.sql", ...readdirSync(batchDir).filter((f) => f.startsWith("deg_"))].map(
    (f) => join(batchDir, f)
  );
  for (const file of files) {
    const sql = readFileSync(file, "utf8");
    console.log("Running", file.split(/[/\\]/).pop(), "...");
    try {
      await execViaPg(sql);
    } catch (e) {
      console.warn("  rpc exec_sql unavailable:", e.message);
      console.warn("  Run this file in Supabase SQL editor or add service role seed.");
      break;
    }
  }
}

main();
