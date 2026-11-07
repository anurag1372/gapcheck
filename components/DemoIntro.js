"use client";

import { useState } from "react";
import { useAppState } from "./AppState";

const THEMES = {
  emerald: { bg: "from-emerald-600 to-teal-700", soft: "text-emerald-100", dot: "bg-white text-emerald-700", line: "bg-emerald-300/40" },
  violet: { bg: "from-violet-600 to-indigo-700", soft: "text-violet-100", dot: "bg-white text-violet-700", line: "bg-violet-300/40" },
  rose: { bg: "from-rose-500 to-pink-700", soft: "text-rose-100", dot: "bg-white text-rose-600", line: "bg-rose-300/40" },
  sky: { bg: "from-sky-500 to-blue-700", soft: "text-sky-100", dot: "bg-white text-sky-700", line: "bg-sky-300/40" },
};

export default function DemoIntro() {
  const { persona } = useAppState();
  const [details, setDetails] = useState(true);
  const t = THEMES[persona.theme] || THEMES.emerald;

  return (
    <section className={`overflow-hidden rounded-3xl bg-gradient-to-br ${t.bg} text-white shadow-lg`}>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-widest ${t.soft}`}>
            {persona.role} · {persona.name}
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">Demo guide</span>
        </div>
        <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{persona.tagline}</h2>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-black/20 px-3 py-1 line-through decoration-white/50">{persona.before}</span>
          <span className={t.soft}>→</span>
          <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-900">{persona.after}</span>
        </div>

        <ol className="relative mt-7 grid gap-4 sm:grid-cols-4">
          <span className={`absolute left-4 right-4 top-4 hidden h-0.5 sm:block ${t.line}`} />
          {persona.journey.map((j, i) => (
            <li key={j.title} className="relative">
              <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow ${t.dot}`}>{i + 1}</span>
              <p className="mt-2 font-semibold">{j.title}</p>
              <p className={`text-sm ${t.soft}`}>{j.sub}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/15 px-6 py-3 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-wider ${t.soft}`}>On autopilot</span>
          {persona.autopilot.filter((a) => a.status === "live").map((a) => (
            <span key={a.label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${a.status === "live" ? "bg-lime-300" : "bg-white/40"}`} />
              {a.label}
            </span>
          ))}
        </div>
        <button onClick={() => setDetails(!details)} className="text-xs font-medium underline decoration-white/40 underline-offset-4">
          {details ? "Hide details" : "Details"}
        </button>
      </div>

      {details && (
        <div className="grid gap-6 bg-white p-6 text-slate-800 sm:grid-cols-3 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">The problem</p>
            <p className="mt-1 text-sm">{persona.problem}</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {persona.pains.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Step by step</p>
            <ol className="mt-1 space-y-1.5 text-sm">
              {persona.flow.map((f, i) => (
                <li key={f.step} className="flex gap-2">
                  <span className="font-semibold text-emerald-700">{i + 1}.</span>
                  <span>{f.step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">What they can adjust</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {persona.adjust.map((a) => (
                <span key={a} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs">
                  {a}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-sky-700">Alerts</p>
            <ul className="mt-1 space-y-1 text-sm text-slate-600">
              {persona.alerts.filter((a) => !/planned/i.test(a)).map((a) => (
                <li key={a}>• {a}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
