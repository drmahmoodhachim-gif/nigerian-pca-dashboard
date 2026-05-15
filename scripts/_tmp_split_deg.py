from pathlib import Path

sql = Path(r"d:\Ahmed labstuff\Nigerian Paper\Manuscript\dashboard\scripts\sql-batches\_deg_mcp_combo_oneline\00.sql").read_text(
    encoding="utf-8"
)
sep = ";" + chr(92) + "n"
parts = [p.strip() for p in sql.split(sep) if p.strip()]
print("sep_repr", repr(sep))
print("n_parts", len(parts))
print("lens", [len(p) for p in parts])
