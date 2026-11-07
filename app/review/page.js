"use client";

import DemoIntro from "@/components/DemoIntro";
import AskPanel from "@/components/AskPanel";
import { useState } from "react";
import { Card } from "@/components/ui";
import { REVIEWER_RULES } from "@/data/reviewerRules.mjs";
import { TelegramLogo } from "@/components/Integrations";

const tone = { high: "bg-red-100 text-red-800", medium: "bg-amber-100 text-amber-800", low: "bg-slate-100 text-slate-700" };

export default function ReviewPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const review = async (f) => {
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/review", { method: "POST", body: fd });
    setResult(await res.json());
    setBusy(false);
  };

  const run = (e) => {
    e.preventDefault();
    if (file) review(file);
  };

  const trySample = async () => {
    const blob = await (await fetch("/sample-application.txt")).blob();
    const f = new File([blob], "Harborlight Commons application (sample).txt", { type: "text/plain" });
    setFile(f);
    review(f);
  };

  return (
    <div className="space-y-6">
      <DemoIntro />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Will this application survive review?</h1>
            <p className="text-sm text-slate-500">Claude reads it and pulls every number. Fixed rules from real funder reviewers check them.</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs">
            <TelegramLogo className="h-4 w-4" /> Summary sent to Telegram
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={trySample}
            disabled={busy}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            Try the sample application
          </button>
          <span className="text-xs text-slate-400">or</span>
          <form onSubmit={run} className="flex flex-wrap items-center gap-3">
            <input type="file" accept=".pdf,.xlsx,.xls,.txt,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
            <button disabled={!file || busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">
              Review my file
            </button>
          </form>
        </div>
        {busy && <p className="mt-3 animate-pulse text-sm text-violet-700">Claude is reading {file?.name}… this takes about 30 seconds.</p>}
      </Card>

      {result?.error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{result.error}</p>}

      {result?.flags && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {result.flags.length} issue{result.flags.length === 1 ? "" : "s"} to fix before you submit
            </h2>
            {result.telegram?.ok && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <TelegramLogo className="h-4 w-4" /> Summary sent
              </span>
            )}
          </div>
          <ul className="mt-3 space-y-3">
            {result.flags.map((f, i) => (
              <li key={i} className="rounded-xl border border-slate-100 p-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[f.severity]}`}>{f.severity}</span>
                <p className="mt-1 font-medium">{f.title}</p>
                <p className="text-sm text-slate-600">{f.detail}</p>
              </li>
            ))}
          </ul>
          <details className="mt-4 text-xs text-slate-500">
            <summary>What Claude extracted</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(result.extracted, null, 2)}</pre>
          </details>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold">The {REVIEWER_RULES.length} rules every application is checked against</h2>
        <p className="text-xs text-slate-500">From the Bank of America Affordable Housing Challenge 2026: reviewer feedback and the competition model.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {REVIEWER_RULES.map((r) => (
            <li key={r.id} className="flex gap-2 rounded-lg bg-slate-50 p-2.5 text-sm">
              <span className="text-violet-600">✓</span>
              <span>{r.rule}</span>
            </li>
          ))}
        </ul>
      </Card>

      <AskPanel />
    </div>
  );
}
