/**
 * Split large SQL files and print batch indices for manual/MCP apply.
 * Primary data load: npm run seed (needs service role).
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "sql-batches");
const fgsea = readFileSync(join(dir, "fgsea.sql"), "utf8");
console.log("fgsea.sql bytes:", fgsea.length);
console.log("deg batches:", readdirSync(dir).filter((f) => f.startsWith("deg_")).length);
