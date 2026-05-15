import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Comparison, DegRow } from "../lib/database.types";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

export default function DegExplorer() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [slug, setSlug] = useState("");
  const [rows, setRows] = useState<DegRow[]>([]);
  const [geneFilter, setGeneFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("pc_comparisons")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data?.length) {
          setComparisons(data);
          setSlug(data[0].slug);
        }
      });
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from("pc_deg")
      .select("*")
      .eq("comparison_slug", slug)
      .order("padj", { ascending: true })
      .limit(5000)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, [slug]);

  const filtered = useMemo(() => {
    const q = geneFilter.trim().toUpperCase();
    if (!q) return rows;
    return rows.filter((r) => r.gene_name.toUpperCase().includes(q));
  }, [rows, geneFilter]);

  const scatter = useMemo(
    () =>
      filtered.map((r) => ({
        gene: r.gene_name,
        x: r.log2_fold_change,
        y: -Math.log10(Math.max(r.padj, 1e-300)),
        padj: r.padj,
      })),
    [filtered]
  );

  const comp = comparisons.find((c) => c.slug === slug);

  return (
    <section className="panel">
      <h2>Differential expression</h2>
      {comp?.description && <p className="hint">{comp.description}</p>}

      <div className="controls">
        <label>
          Comparison
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {comparisons.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Filter gene
          <input
            type="search"
            placeholder="e.g. KLK3"
            value={geneFilter}
            onChange={(e) => setGeneFilter(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <p className="loading">Loading DEGs…</p>
      ) : rows.length === 0 ? (
        <p className="empty">
          No DEG data for this comparison yet. Run{" "}
          <code>npm run seed</code> with your Supabase service role key.
        </p>
      ) : (
        <>
          <p className="hint">
            Showing {filtered.length} significant genes (padj &lt; 0.05, |log2FC|
            ≥ 0.5). Volcano: log2FC vs −log10(padj).
          </p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 12, bottom: 24, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3f56" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="log2FC"
                  tick={{ fill: "#8fa3b8", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="-log10 padj"
                  tick={{ fill: "#8fa3b8", fontSize: 11 }}
                />
                <ZAxis range={[40, 40]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    background: "#1a2332",
                    border: "1px solid #2d3f56",
                    borderRadius: 8,
                  }}
                  formatter={(v: number, name: string) => [
                    typeof v === "number" ? v.toFixed(3) : v,
                    name,
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.gene ?? ""
                  }
                />
                <Scatter data={scatter} fill="#3d9aed" fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <table className="data">
            <thead>
              <tr>
                <th>Gene</th>
                <th>log2FC</th>
                <th>padj</th>
                <th>Direction</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((r) => (
                <tr key={r.id}>
                  <td>
                    <code>{r.gene_name}</code>
                  </td>
                  <td>{r.log2_fold_change.toFixed(3)}</td>
                  <td>{r.padj.toExponential(2)}</td>
                  <td>{r.direction}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p className="hint">Table shows top 100 of {filtered.length} genes.</p>
          )}
        </>
      )}
    </section>
  );
}
