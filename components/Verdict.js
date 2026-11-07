"use client";

import { useAppState } from "./AppState";
import { computeGap, whoClosesTheGap, usd } from "@/lib/engine.mjs";

const TONE = {
  family: "bg-emerald-500",
  confirmed: "bg-sky-500",
  unconfirmed: "bg-amber-400",
  gap: "bg-red-500",
};

export default function Verdict() {
  const { deal, ratePct, assumptions } = useAppState();
  const g = computeGap(deal, ratePct, assumptions);
  const v = whoClosesTheGap(deal, g);

  return (
    <div className={`overflow-hidden rounded-2xl border-2 ${v.pencils ? "border-emerald-500" : "border-red-500"} bg-white shadow-sm`}>
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Does it pencil?</p>
          <p className={`mt-1 text-5xl font-black tracking-tight ${v.pencils ? "text-emerald-600" : "text-red-600"}`}>{v.pencils ? "Yes." : "Not yet."}</p>
          <p className="mt-2 text-lg text-slate-700">
            {v.pencils ? (
              <>Every dollar of this home is covered at {ratePct}%.</>
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
    </div>
  );
}
