import { ImageResponse } from "next/og";
import { computeGap, whoClosesTheGap, usd } from "./engine.mjs";

const Row = ({ label, before, after, strong }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #e2e8f0", fontSize: 30 }}>
    <span style={{ color: "#475569" }}>{label}</span>
    <span style={{ display: "flex", gap: 16 }}>
      <span style={{ color: "#94a3b8" }}>{before}</span>
      <span style={{ color: "#94a3b8" }}>→</span>
      <span style={{ fontWeight: 700, color: strong ? "#b91c1c" : "#0f172a" }}>{after}</span>
    </span>
  </div>
);

export function alertCard({ deal, oldRate, newRate, rateDate, assumptions, title = "Rate alert" }) {
  const before = computeGap(deal, oldRate, assumptions);
  const after = computeGap(deal, newRate, assumptions);
  const v = whoClosesTheGap(deal, after);
  const delta = after.gap - before.gap;
  const pencils = after.gap <= 0;
  const up = newRate > oldRate;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f8fafc", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", padding: "40px 56px", background: "linear-gradient(135deg, #059669, #0f766e)", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, opacity: 0.85 }}>
            <span>GAP CHECK · {title.toUpperCase()}</span>
            <span>{rateDate || ""}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 14 }}>
            <span style={{ fontSize: 40, opacity: 0.8 }}>30-yr rate</span>
            <span style={{ fontSize: 64, fontWeight: 800 }}>
              {oldRate.toFixed(2)}% {up ? "▲" : "▼"} {newRate.toFixed(2)}%
            </span>
          </div>
          <div style={{ display: "flex", fontSize: 26, marginTop: 6, opacity: 0.85 }}>{deal.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", padding: "28px 56px", flex: 1 }}>
          <Row label="Family can pay (state law)" before={usd(before.familyPrice)} after={usd(after.familyPrice)} />
          <Row label="Gap per home" before={usd(Math.max(before.gap, 0))} after={usd(Math.max(after.gap, 0))} strong={!pencils} />

          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 26 }}>
            <div
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                fontSize: 30,
                fontWeight: 700,
                background: pencils ? "#dcfce7" : "#fee2e2",
                color: pencils ? "#166534" : "#991b1b",
              }}
            >
              {pencils ? "Pencils" : "Does not pencil"}
            </div>
            <span style={{ fontSize: 30, color: delta > 0 ? "#b91c1c" : "#166534", fontWeight: 700 }}>
              {delta >= 0 ? "+" : "−"}
              {usd(Math.abs(delta))} gap this week
            </span>
          </div>

          {!pencils && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
              <span style={{ fontSize: 22, color: "#64748b", letterSpacing: 2 }}>WHO CLOSES IT</span>
              {v.closers.map((c, i) => (
                <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 28, marginTop: 10 }}>
                  <span>
                    {i + 1}. {c.name}
                  </span>
                  <span style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontWeight: 700 }}>{usd(c.amount)}</span>
                    <span style={{ color: "#94a3b8" }}>{c.certainty}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", padding: "16px 56px", fontSize: 18, color: "#94a3b8" }}>
          Sources: Freddie Mac PMMS · HCD 2026 income limits · Cal. HSC § 50052.5 · Synthetic deal
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
