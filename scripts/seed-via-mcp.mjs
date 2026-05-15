/**
 * Generates SQL files for fgsea + DEG to load via Supabase SQL editor or service role seed.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAPER2 = join(__dirname, "../../Paper-2");
const OUT = join(__dirname, "sql-batches");
mkdirSync(OUT, { recursive: true });

const PADJ_MAX = 0.05;
const LFC_MIN = 0.5;

function strip(s) {
  return String(s).replace(/^"|"$/g, "");
}

function parseTsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split("\t").map(strip);
  return lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const row = {};
    headers.forEach((h, i) => (row[h] = strip(cols[i] ?? "")));
    return row;
  });
}

function num(v) {
  if (!v || v === "NA") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function esc(s) {
  return String(s).replace(/'/g, "''");
}

// fgsea
const fgseaDir = join(PAPER2, "Results", "pathways");
const fgseaFiles = readdirSync(fgseaDir).filter(
  (f) => f.startsWith("fgsea_HALLMARK_") && f.endsWith(".tsv") && !f.includes(".rnk.")
);
const fgseaRows = [];
for (const file of fgseaFiles) {
  const slug = file.replace(/^fgsea_HALLMARK_/, "").replace(/\.tsv$/, "");
  for (const r of parseTsv(readFileSync(join(fgseaDir, file), "utf8"))) {
    fgseaRows.push(
      `('${esc(slug)}','${esc(r.pathway)}',${num(r.NES)},${num(r.padj)},${num(r.pval)},${num(r.size) != null ? Math.round(num(r.size)) : "NULL"})`
    );
  }
}
writeFileSync(
  join(OUT, "fgsea.sql"),
  `DELETE FROM public.pc_fgsea;\nINSERT INTO public.pc_fgsea (comparison_slug, pathway, nes, padj, pval, size) VALUES\n${fgseaRows.join(",\n")};`
);
console.log("fgsea:", fgseaRows.length);

// DEG batches
const degDir = join(PAPER2, "data", "DEG", "tables");
let batch = 0;
let chunk = [];
let total = 0;

function flush(slug) {
  if (!chunk.length) return;
  const sql = `INSERT INTO public.pc_deg (comparison_slug, ensembl_id, gene_name, base_mean, log2_fold_change, padj) VALUES\n${chunk.join(",\n")};`;
  writeFileSync(join(OUT, `deg_${slug}_batch${batch++}.sql`), sql);
  total += chunk.length;
  chunk = [];
}

for (const file of readdirSync(degDir).filter((f) => f.startsWith("DEG_"))) {
  const slug = file.replace(/^DEG_/, "").replace(/\.tsv$/, "");
  batch = 0;
  for (const r of parseTsv(readFileSync(join(degDir, file), "utf8"))) {
    const padj = num(r.padj);
    const lfc = num(r.log2FoldChange);
    if (padj == null || padj >= PADJ_MAX || lfc == null || Math.abs(lfc) < LFC_MIN) continue;
    chunk.push(
      `('${esc(slug)}','${esc(r.ensembl_id)}','${esc(r.gene_name)}',${num(r.baseMean)},${lfc},${padj})`
    );
    if (chunk.length >= 400) flush(slug);
  }
  flush(slug);
  console.log("DEG", slug, "done");
}
console.log("DEG total rows:", total);
