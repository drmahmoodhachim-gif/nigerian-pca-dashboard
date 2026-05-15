/**
 * Upload Paper-2 results to Supabase (requires service role key).
 *
 * Usage:
 *   cp .env.example .env.local   # add SUPABASE_SERVICE_ROLE_KEY
 *   npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

function loadEnvFile(name) {
  const path = join(dirname(fileURLToPath(import.meta.url)), "..", name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAPER2 = join(ROOT, "..", "Paper-2");

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PADJ_MAX = 0.05;
const LFC_MIN = 0.5;
const BATCH = 500;

function strip(s) {
  return String(s).replace(/^"|"$/g, "");
}

function parseTsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split("\t").map(strip);
  return lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const row = {};
    headers.forEach((h, i) => {
      row[h] = strip(cols[i] ?? "");
    });
    return row;
  });
}

function num(v) {
  if (v == null || v === "" || v === "NA" || v === "NaN") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function degSlugFromFile(name) {
  return name.replace(/^DEG_/, "").replace(/\.tsv$/, "");
}

function fgseaSlugFromFile(name) {
  return name.replace(/^fgsea_HALLMARK_/, "").replace(/\.tsv$/, "");
}

async function upsertBatches(table, rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(table).upsert(chunk, {
      onConflict: table === "pc_deg" ? undefined : undefined,
      ignoreDuplicates: false,
    });
    if (error) {
      if (table === "pc_deg") {
        const { error: insErr } = await supabase.from(table).insert(chunk);
        if (insErr) throw insErr;
      } else throw error;
    }
    process.stdout.write(`  ${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`);
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

async function clearTable(table) {
  const { error } = await supabase.from(table).delete().neq("id", 0);
  if (error && !error.message.includes("column")) {
    const { error: e2 } = await supabase.from(table).delete().gte("id", 0);
    if (e2) console.warn(`  clear ${table}:`, e2.message);
  }
}

async function seedDeg() {
  const dir = join(PAPER2, "data", "DEG", "tables");
  if (!existsSync(dir)) {
    console.warn("DEG tables not found:", dir);
    return;
  }
  await clearTable("pc_deg");
  const files = readdirSync(dir).filter((f) => f.startsWith("DEG_") && f.endsWith(".tsv"));
  let total = 0;
  for (const file of files) {
    const slug = degSlugFromFile(file);
    const rows = parseTsv(readFileSync(join(dir, file), "utf8"))
      .filter((r) => {
        const padj = num(r.padj);
        const lfc = num(r.log2FoldChange);
        return padj != null && padj < PADJ_MAX && lfc != null && Math.abs(lfc) >= LFC_MIN;
      })
      .map((r) => ({
        comparison_slug: slug,
        ensembl_id: r.ensembl_id || null,
        gene_name: r.gene_name,
        base_mean: num(r.baseMean),
        log2_fold_change: num(r.log2FoldChange),
        padj: num(r.padj),
      }));
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabase.from("pc_deg").insert(rows.slice(i, i + BATCH));
      if (error) throw error;
    }
    total += rows.length;
    console.log(`  DEG ${slug}: ${rows.length} sig genes`);
  }
  console.log(`  pc_deg total: ${total}`);
}

async function seedFgsea() {
  const dir = join(PAPER2, "Results", "pathways");
  if (!existsSync(dir)) return;
  await clearTable("pc_fgsea");
  const files = readdirSync(dir).filter(
    (f) => f.startsWith("fgsea_HALLMARK_") && f.endsWith(".tsv") && !f.includes(".rnk.")
  );
  const all = [];
  for (const file of files) {
    const slug = fgseaSlugFromFile(file);
    parseTsv(readFileSync(join(dir, file), "utf8")).forEach((r) => {
      all.push({
        comparison_slug: slug,
        pathway: r.pathway,
        nes: num(r.NES),
        padj: num(r.padj),
        pval: num(r.pval),
        size: num(r.size) != null ? Math.round(num(r.size)) : null,
      });
    });
  }
  for (let i = 0; i < all.length; i += BATCH) {
    const { error } = await supabase.from("pc_fgsea").insert(all.slice(i, i + BATCH));
    if (error) throw error;
  }
  console.log(`  pc_fgsea: ${all.length} rows`);
}

async function seedProgeny() {
  const path = join(PAPER2, "Results", "pathways", "PROGENy_pathway_scores.tsv");
  if (!existsSync(path)) return;
  await clearTable("pc_progeny");
  const rows = parseTsv(readFileSync(path, "utf8"));
  const pathways = Object.keys(rows[0]).filter((k) => k !== "Androgen" || rows[0][k] !== undefined);
  const headerKeys = Object.keys(rows[0]);
  const pathwayCols = headerKeys;
  const inserts = [];
  for (const row of rows) {
    const sampleId = row[pathwayCols[0]] ?? row.Androgen;
    if (!sampleId || !sampleId.startsWith("D")) continue;
    for (const pw of pathwayCols) {
      if (pw === sampleId) continue;
      const score = num(row[pw]);
      if (score == null) continue;
      inserts.push({ sample_id: sampleId, pathway: pw, score });
    }
  }
  const fixed = [];
  const text = readFileSync(path, "utf8").trim().split(/\r?\n/);
  const headers = text[0].split("\t");
  for (let li = 1; li < text.length; li++) {
    const cols = text[li].split("\t");
    const sampleId = cols[0];
    for (let h = 0; h < headers.length; h++) {
      const score = num(cols[h + 1]);
      if (score != null) {
        fixed.push({
          sample_id: sampleId,
          pathway: headers[h],
          score,
        });
      }
    }
  }
  for (let i = 0; i < fixed.length; i += BATCH) {
    const { error } = await supabase.from("pc_progeny").upsert(fixed.slice(i, i + BATCH), {
      onConflict: "sample_id,pathway",
    });
    if (error) throw error;
  }
  console.log(`  pc_progeny: ${fixed.length} rows`);
}

async function seedEstimate() {
  const path = join(PAPER2, "Results", "signatures", "ESTIMATE_scores.tsv");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8").trim().split(/\r?\n/);
  const samples = text[0].split("\t").slice(1);
  const rows = [];
  for (let i = 1; i < text.length; i++) {
    const [metric, ...vals] = text[i].split("\t");
    samples.forEach((sid, j) => {
      if (!rows[j]) {
        rows[j] = { sample_id: sid };
      }
      const v = num(vals[j]);
      if (metric.toLowerCase().includes("stroma")) rows[j].stroma_score = v;
      else if (metric.toLowerCase().includes("immune")) rows[j].immune_score = v;
      else if (metric.toLowerCase().includes("estimate")) rows[j].estimate_score = v;
      else if (metric.toLowerCase().includes("purity")) rows[j].tumor_purity = v;
    });
  }
  const { error } = await supabase.from("pc_estimate").upsert(rows, {
    onConflict: "sample_id",
  });
  if (error) throw error;
  console.log(`  pc_estimate: ${rows.length} rows`);
}

async function main() {
  console.log("Seeding Supabase from Paper-2…\n");
  await seedEstimate();
  await seedProgeny();
  await seedFgsea();
  await seedDeg();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
