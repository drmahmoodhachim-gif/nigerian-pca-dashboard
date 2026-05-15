import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { EstimateRow, Sample } from "../lib/database.types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function SampleOverview() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [estimate, setEstimate] = useState<EstimateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sRes, eRes] = await Promise.all([
        supabase.from("pc_samples").select("*").order("sample_id"),
        supabase.from("pc_estimate").select("*").order("sample_id"),
      ]);
      if (sRes.data) setSamples(sRes.data);
      if (eRes.data) setEstimate(eRes.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="loading">Loading samples…</p>;

  const ng = samples.filter((s) => s.cohort === "Nigerian").length;
  const pt = samples.filter((s) => s.cohort === "Portuguese").length;

  const purityChart = estimate.map((e) => ({
    sample: e.sample_id,
    purity: e.tumor_purity != null ? +(e.tumor_purity * 100).toFixed(1) : null,
  }));

  return (
    <>
      <div className="stats-grid">
        <div className="stat">
          <div className="value">{samples.length}</div>
          <div className="label">Samples</div>
        </div>
        <div className="stat">
          <div className="value">{ng}</div>
          <div className="label">Nigerian</div>
        </div>
        <div className="stat">
          <div className="value">{pt}</div>
          <div className="label">Portuguese</div>
        </div>
      </div>

      <section className="panel">
        <h2>Cohort &amp; samples</h2>
        <p className="hint">
          De-identified IDs (D2–D28). D13 excluded (no sequencing data).
        </p>
        <table className="data">
          <thead>
            <tr>
              <th>Sample</th>
              <th>Cohort</th>
              <th>Condition</th>
              <th>Grade</th>
              <th>Gleason</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((s) => (
              <tr key={s.sample_id}>
                <td>
                  <code>{s.sample_id}</code>
                </td>
                <td>
                  <span
                    className={`badge ${s.cohort === "Nigerian" ? "ng" : "pt"}`}
                  >
                    {s.cohort}
                  </span>
                </td>
                <td>{s.condition}</td>
                <td>{s.condition_grade}</td>
                <td>{s.gleason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {purityChart.length > 0 && (
        <section className="panel">
          <h2>ESTIMATE tumor purity (%)</h2>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purityChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3f56" />
                <XAxis dataKey="sample" tick={{ fill: "#8fa3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8fa3b8", fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "#1a2332",
                    border: "1px solid #2d3f56",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="purity" fill="#3d9aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </>
  );
}
