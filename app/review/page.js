"use client";

import DemoIntro from "@/components/DemoIntro";
import AskPanel from "@/components/AskPanel";
import { useState } from "react";
import { Card } from "@/components/ui";

const tone = { high: "bg-red-100 text-red-800", medium: "bg-amber-100 text-amber-800", low: "bg-slate-100 text-slate-700" };

export default function ReviewPage() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/review", { method: "POST", body: fd });
    setResult(await res.json());
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <DemoIntro />
      <AskPanel />
      <div>
        <p className="text-sm text-slate-500">Development director</p>
        <h1 className="text-2xl font-semibold">Will this application survive review?</h1>
        <p className="text-sm text-slate-500">
          Claude extracts the numbers. Fixed rules, built from real funder reviewer feedback, check them. Every flag quotes where it came from.
        </p>
      </div>

      <Card>
        <form onSubmit={run} className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".pdf,.xlsx,.xls,.txt,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          <button disabled={!file || busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">
            {busy ? "Reviewing…" : "Review application"}
          </button>
        </form>
      </Card>

      {result?.error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{result.error}</p>}

      {result?.flags && (
        <Card>
          <h2 className="font-semibold">
            {result.flags.length} issue{result.flags.length === 1 ? "" : "s"} found
          </h2>
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
    </div>
  );
}
