"""Emit raw SQL from _invoke_args_deg_NN.json to stdout (for MCP execute_sql payloads)."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> None:
    i = int(sys.argv[1])
    name = f"_invoke_args_deg_{i:02d}.json"
    obj = json.loads((ROOT / name).read_text(encoding="utf-8"))
    # Combo files store literal "\\n" between statements; Postgres needs real newlines.
    sys.stdout.write(obj["query"].replace("\\n", "\n"))


if __name__ == "__main__":
    main()
