"use client";

import { useAppState } from "./AppState";
import { computeGap, whoClosesTheGap, leversToPencil, usd } from "@/lib/engine.mjs";

const TONE = {
  family: "bg-emerald-500",
  confirmed: "bg-sky-500",
  unconfirmed: "bg-amber-400",
  gap: "bg-red-500",
};

export default function Verdict() {
  const { deal, setDeal, ratePct, setRatePct, setRateInfo, assumptions, resetDeal } = useAppState();
  const g = computeGap(deal, ratePct, assumptions);
  const v = whoClosesTheGap(deal, g);
  const levers = leversToPencil(deal, ratePct, assumptions);
  const apply = (l) => {
    if (l.deal) setDeal(l.deal);
    if (l.rate) {
      setRatePct(l.rate);
      setRateInfo({ date: "simulated", live: false });
    }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border-2 ${v.pencils ? "border-emerald-500" : "border-red-500"} bg-white shadow-sm`}>
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Does it pencil?</p>
          <p className={`mt-1 text-5xl font-black tracking-tight ${v.pencils ? "text-emerald-600" : "text-red-600"}`}>{v.pencils ? "Yes." : "Not yet."}</p>
          <p className="mt-2 text-lg text-slate-700">
            {v.pencils ? (
              <>
                Every dollar of this home is covered at {ratePct}%
                {g.atRisk > 0 ? (
                  <>
                    , if the <b className="text-amber-600">{usd(g.atRisk)}</b> not yet confirmed comes through.
                  </>
                ) : (
                  "."
                )}
              </>
            ) : (
              <>
                Short <b className="text-red-600">{usd(g.gap)}</b> per home at today&apos;s {ratePct}% rate.
                {g.atRisk > 0 && (
                  <>
                    {" "}
                    If unconfirmed money falls through, <b className="text-amber-600">{usd(g.gapIfUnconfirmedFails)}</b>.
                  </>
                )}
              </>
            )}
          </p>

          <div className="mt-5">
            <div className="flex h-8 w-full overflow-hidden rounded-lg">
              {v.parts
                .filter((p) => p.amount > 0)
                .map((p) => (
                  <div key={p.key} className={`${TONE[p.tone]} h-full`} style={{ width: `${(p.amount / g.totalCost) * 100}%` }} title={`${p.label}: ${usd(p.amount)}`} />
                ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              {v.parts.map((p) => (
                <span key={p.key} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-sm ${TONE[p.tone]}`} />
                  {p.label} <b>{usd(p.amount)}</b>
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">Cost to create one home: {usd(g.totalCost)}</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Who closes the gap?</p>
          {v.pencils ? (
            <p className="mt-2 text-sm text-slate-700">Nothing left to close. Lock in the unconfirmed sources before rates move.</p>
          ) : (
            <ol className="mt-2 space-y-2">
              {v.closers.map((c, i) => (
                <li key={c.name} className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {c.url ? (
                          <a href={c.url} target="_blank" className="hover:underline">
                            {c.name}
                          </a>
                        ) : (
                          c.name
                        )}
                      </p>
                      <p className="text-xs text-slate-500">{c.how}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{usd(c.amount)}</p>
                    <p
                      className={`text-[11px] font-medium ${c.certainty === "Open now" ? "text-emerald-600" : c.certainty === "To fundraise" ? "text-red-600" : "text-amber-600"}`}
                    >
                      {c.certainty}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-[11px] text-slate-400">
            Open programs are applied first, then lotteries (not counted as closing the gap). Program eligibility and stacking must be confirmed with each
            program. Deal dollars are synthetic assumptions.
          </p>
        </div>
      </div>
      {v.pencils ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200 bg-emerald-50 px-6 py-4">
          <p className="text-sm text-emerald-800">
            <b>It pencils.</b> Next: get every unconfirmed source in writing before rates move. The Thursday alert will tell you if they do.
          </p>
          <button onClick={resetDeal} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-100">
            Start over
          </button>
        </div>
      ) : (
        <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Make it pencil: pick a move</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {levers.map((l) => {
              const closes = l.newGap <= 0;
              return (
                <button
                  key={l.id}
                  onClick={() => apply(l)}
                  disabled={l.id === "rate" && !l.rate}
                  className={`group rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 ${l.recommended ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">{l.title}</p>
                    {l.recommended && <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Best</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{l.detail}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-sm font-bold ${closes ? "text-emerald-600" : "text-amber-600"}`}>
                      {closes ? "Pencils" : `Gap → ${usd(l.newGap)}`}
                    </span>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-900">Apply →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
