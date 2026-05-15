from pathlib import Path

base = Path(r"d:\Ahmed labstuff\Nigerian Paper\Manuscript\dashboard\scripts\sql-batches\_deg_mcp_combo_oneline")
sep = ";" + chr(92) + "n"
total = 0
for i in range(23):
    p = base / f"{i:02d}.sql"
    sql = p.read_text(encoding="utf-8")
    parts = [x.strip() for x in sql.split(sep) if x.strip()]
    mx = max(len(x) for x in parts)
    total += len(parts)
    print(i, len(parts), mx)
print("total_parts", total)
