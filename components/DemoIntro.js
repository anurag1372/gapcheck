"use client";

import { useState } from "react";
import { useAppState } from "./AppState";

export default function DemoIntro() {
  const { persona } = useAppState();
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-3 text-left">
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Demo guide</span>
          <span className="text-sm font-medium text-slate-700">
            {persona.role}: {persona.name}
          </span>
        </span>
        <span className="text-xs text-slate-500">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="space-y-5 px-5 pb-5">
          <div className="rounded-xl bg-indigo-600 px-4 py-3 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200">What Gap Check does for {persona.name}</p>
            <p className="mt-0.5 text-sm">{persona.valueProp}</p>
          </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">The problem</p>
            <p className="mt-1 text-sm text-slate-700">{persona.problem}</p>
            <ul className="mt-3 space-y-1">
              {persona.pains.map((p) => (
                <li key={p} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">How Gap Check helps</p>
            <ol className="mt-2 grid gap-2 sm:grid-cols-2">
              {persona.flow.map((f, i) => (
                <li key={f.step} className="flex gap-3 rounded-xl border border-slate-200 bg-white/80 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{f.step}</span>
                    <span className="block text-xs text-slate-600">{f.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Alerts they get</p>
              <ul className="mt-1 space-y-1">
                {persona.alerts.map((a) => (
                  <li key={a} className="text-sm text-slate-700">
                    {a.includes("(planned)") ? (
                      <>
                        {a.replace(" (planned)", "")} <span className="rounded bg-slate-200 px-1.5 text-[10px] text-slate-600">planned</span>
                      </>
                    ) : (
                      <>
                        {a} <span className="rounded bg-emerald-100 px-1.5 text-[10px] text-emerald-700">live</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">What they can adjust</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {persona.adjust.map((a) => (
                  <span key={a} className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-xs text-slate-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
