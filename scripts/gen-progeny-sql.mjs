import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const path = join(dir, "../../Paper-2/Results/pathways/PROGENy_pathway_scores.tsv");
const lines = readFileSync(path, "utf8").trim().split(/\r?\n/);
const headers = lines[0].split("\t");
const vals = [];
for (let i = 1; i < lines.length; i++) {
  const c = lines[i].split("\t");
  const sid = c[0];
  for (let h = 0; h < headers.length; h++) {
    vals.push(`('${sid}','${headers[h].replace(/'/g, "''")}',${c[h + 1]})`);
  }
}
const sql = `INSERT INTO public.pc_progeny (sample_id, pathway, score) VALUES\n${vals.join(",\n")}\nON CONFLICT (sample_id, pathway) DO UPDATE SET score = EXCLUDED.score;`;
writeFileSync(join(dir, "progeny-insert.sql"), sql);
console.log("Wrote", vals.length, "rows");
