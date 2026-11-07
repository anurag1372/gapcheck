"use client";

import { useEffect, useState } from "react";
import { useAppState } from "./AppState";
import { computeGap, usd } from "@/lib/engine.mjs";

const fmtDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function RateHistory() {
  const { deal, assumptions } = useAppState();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/rate/history")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data?.history?.length) return null;
  const weeks = data.history.map((w) => ({ ...w, g: computeGap(deal, w.rate, assumptions) }));
  const maxGap = Math.max(...weeks.map((w) => Math.max(w.g.gap, 0)), 1);
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const drift = last.g.gap - first.g.gap;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Rate history: how each Thursday changed your gap</h3>
        <span className="text-xs text-slate-500">
          Freddie Mac 30-yr fixed · {data.live ? "live" : "cached"} · last {weeks.length} weeks
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Since {fmtDate(first.date)}, rates went {first.rate.toFixed(2)}% → {last.rate.toFixed(2)}% and the gap{" "}
        <b className={drift > 0 ? "text-red-700" : "text-emerald-700"}>
          {drift > 0 ? "grew" : "shrank"} {usd(Math.abs(drift))}
        </b>{" "}
        per home. Nobody had to rebuild a spreadsheet.
      </p>

      <ul className="mt-4 space-y-1.5">
        {weeks.map((w, i) => {
          const prev = weeks[i - 1];
          const d = prev ? w.g.gap - prev.g.gap : 0;
          return (
            <li key={w.date} className="grid grid-cols-[4.5rem_3.5rem_1fr_5.5rem_4.5rem] items-center gap-3 text-sm">
              <span className="text-slate-500">{fmtDate(w.date)}</span>
              <span className="font-medium tabular-nums">{w.rate.toFixed(2)}%</span>
              <span className="h-2.5 rounded-full bg-slate-100">
                <span
                  className={`block h-2.5 rounded-full ${i === weeks.length - 1 ? "bg-red-500" : "bg-red-300"}`}
                  style={{ width: `${(Math.max(w.g.gap, 0) / maxGap) * 100}%` }}
                />
              </span>
              <span className="text-right font-semibold tabular-nums">{usd(Math.max(w.g.gap, 0))}</span>
              <span className={`text-right text-xs tabular-nums ${d > 0 ? "text-red-600" : d < 0 ? "text-emerald-600" : "text-slate-300"}`}>
                {prev ? `${d > 0 ? "+" : d < 0 ? "−" : ""}${usd(Math.abs(d))}` : "start"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
