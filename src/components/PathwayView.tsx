import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Comparison, FgseaRow } from "../lib/database.types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function PathwayView() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [slug, setSlug] = useState("");
  const [rows, setRows] = useState<FgseaRow[]>([]);
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
      .from("pc_fgsea")
      .select("*")
      .eq("comparison_slug", slug)
      .order("padj", { ascending: true })
      .limit(25)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, [slug]);

  const chart = rows.map((r) => ({
    pathway: r.pathway.replace(/^HALLMARK_/, "").replace(/_/g, " ").slice(0, 28),
    nes: r.nes ?? 0,
    padj: r.padj,
  }));

  return (
    <section className="panel">
      <h2>Pathway enrichment (Hallmark fgsea)</h2>
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
      </div>

      {loading ? (
        <p className="loading">Loading pathways…</p>
      ) : rows.length === 0 ? (
        <p className="empty">
          No pathway data yet. Run <code>npm run seed</code> to load fgsea results.
        </p>
      ) : (
        <div className="chart-wrap tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chart}
              margin={{ top: 8, right: 24, left: 120, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3f56" />
              <XAxis type="number" tick={{ fill: "#8fa3b8", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="pathway"
                width={110}
                tick={{ fill: "#8fa3b8", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a2332",
                  border: "1px solid #2d3f56",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="nes" radius={[0, 4, 4, 0]}>
                {chart.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.nes >= 0 ? "#e85d75" : "#3d9aed"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
