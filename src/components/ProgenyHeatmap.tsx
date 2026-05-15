import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ProgenyRow, Sample } from "../lib/database.types";

export default function ProgenyHeatmap() {
  const [rows, setRows] = useState<ProgenyRow[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("pc_progeny").select("*"),
      supabase.from("pc_samples").select("*").order("sample_id"),
    ]).then(([pRes, sRes]) => {
      if (pRes.data) setRows(pRes.data);
      if (sRes.data) setSamples(sRes.data);
      setLoading(false);
    });
  }, []);

  const { pathways, matrix, min, max } = useMemo(() => {
    const pathwaySet = [...new Set(rows.map((r) => r.pathway))].sort();
    const sampleIds = samples.map((s) => s.sample_id);
    const map = new Map(rows.map((r) => [`${r.sample_id}|${r.pathway}`, r.score]));
    const vals = rows.map((r) => r.score);
    const minV = vals.length ? Math.min(...vals) : 0;
    const maxV = vals.length ? Math.max(...vals) : 1;
    const matrix = pathwaySet.map((pw) =>
      sampleIds.map((sid) => map.get(`${sid}|${pw}`) ?? null)
    );
    return { pathways: pathwaySet, matrix, min: minV, max: maxV };
  }, [rows, samples]);

  function color(score: number | null) {
    if (score == null) return "#243044";
    const t = (score - min) / (max - min || 1);
    const r = Math.round(t < 0.5 ? 61 + t * 2 * (147 - 61) : 147 + (t - 0.5) * 2 * (232 - 147));
    const g = Math.round(t < 0.5 ? 50 + t * 2 * (130 - 50) : 130 + (t - 0.5) * 2 * (93 - 130));
    const b = Math.round(t < 0.5 ? 68 + t * 2 * (237 - 68) : 237 + (t - 0.5) * 2 * (117 - 237));
    return `rgb(${r},${g},${b})`;
  }

  if (loading) return <p className="loading">Loading PROGENy scores…</p>;

  if (rows.length === 0) {
    return (
      <section className="panel">
        <h2>PROGENy pathway activity</h2>
        <p className="empty">
          No PROGENy data yet. Run <code>npm run seed</code> to load scores.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>PROGENy pathway activity by sample</h2>
      <p className="hint">Inferred pathway activity (Androgen, MAPK, PI3K, TGFβ, etc.)</p>
      <div style={{ overflowX: "auto" }}>
        <table className="data" style={{ fontSize: "0.75rem" }}>
          <thead>
            <tr>
              <th>Pathway</th>
              {samples.map((s) => (
                <th key={s.sample_id} title={`${s.cohort} ${s.condition}`}>
                  {s.sample_id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pathways.map((pw, i) => (
              <tr key={pw}>
                <td>{pw}</td>
                {matrix[i].map((score, j) => (
                  <td
                    key={j}
                    style={{
                      background: color(score),
                      textAlign: "center",
                      fontFamily: "var(--mono)",
                      fontSize: "0.7rem",
                    }}
                  >
                    {score != null ? score.toFixed(2) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
