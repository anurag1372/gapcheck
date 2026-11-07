"use client";

import { useEffect, useState } from "react";
import { useAppState } from "./AppState";
import { TelegramLogo, EmailLogo, emailHref } from "./Integrations";

export default function AutoTracker() {
  const { deal, ratePct, setRatePct, setRateInfo, assumptions } = useAppState();
  const [w, setW] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/watch")
      .then((r) => r.json())
      .then(setW)
      .catch(() => {});
  }, []);

  const simulate = async () => {
    const newRate = Math.round((ratePct + 0.14) * 100) / 100;
    setNotice("Sending…");
    const res = await fetch("/api/telegram/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "rate", deal, oldRate: ratePct, newRate, rateDate: "next Thursday", assumptions }),
    });
    const data = await res.json();
    setRatePct(newRate);
    setRateInfo({ date: "simulated", live: false });
    setNotice(data.ok ? `Alert sent: ${ratePct}% → ${newRate}%. Check Telegram.` : `Not sent: ${data.error}`);
  };

  const steps = [
    ["Fetch", "Freddie Mac's weekly 30-year rate file (PMMS CSV)"],
    ["Compare", "Against the last rate the watcher saw"],
    ["Recompute", "State-law family price, gap, who closes it"],
    ["Notify", "Image alert to Telegram, digest by email"],
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {w?.running && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${w?.running ? "bg-lime-500" : "bg-slate-300"}`} />
            </span>
            <h3 className="font-semibold">Auto-tracker</h3>
            <span className="text-xs text-slate-500">{w?.running ? `running · checks every ${w.intervalMin} min` : "start it with npm run bot"}</span>
          </div>
          {w?.rate && (
            <p className="mt-1 text-sm text-slate-600">
              Last seen <b>{w.rate.toFixed(2)}%</b> ({w.date}) · checked {new Date(w.lastCheck).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href="https://t.me/gapcheckclaudebot" target="_blank" className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50">
            <TelegramLogo className="h-4 w-4" /> @gapcheckclaudebot
          </a>
          <a href={emailHref(deal, ratePct, assumptions)} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50">
            <EmailLogo className="h-4 w-4" /> Email digest
          </a>
        </div>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-4">
        {steps.map(([t, d], i) => (
          <li key={t} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-900">
              {i + 1}. {t}
            </p>
            <p className="text-xs text-slate-500">{d}</p>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={simulate} className="flex items-center gap-2 rounded-lg bg-[#229ED9] px-4 py-2 text-sm font-medium text-white hover:brightness-110">
          <TelegramLogo className="h-4 w-4" /> Simulate next Thursday&apos;s alert
        </button>
        {notice && <span className="text-sm text-slate-600">{notice}</span>}
      </div>
    </div>
  );
}
