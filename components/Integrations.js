"use client";

import { useAppState } from "./AppState";
import { computeGap, whoClosesTheGap, usd } from "@/lib/engine.mjs";

export function TelegramLogo({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Telegram">
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path d="M5.4 11.8l11.2-4.3c.5-.2 1 .1.8.9l-1.9 9c-.1.6-.5.8-1.1.5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5.1c.2-.2 0-.3-.4-.1l-6.9 4.4-3-.9c-.6-.2-.7-.6.1-.9z" fill="#fff" />
    </svg>
  );
}

export function EmailLogo({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Email">
      <rect width="24" height="24" rx="6" fill="#EA4335" />
      <path d="M5 8l7 5 7-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="7" width="14" height="10" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.8" />
    </svg>
  );
}

export function emailHref(deal, rate, assumptions) {
  const g = computeGap(deal, rate, assumptions);
  const v = whoClosesTheGap(deal, g);
  const subject = `Gap Check: ${deal.name} ${g.gap > 0 ? `is short ${usd(g.gap)}` : "pencils"} at ${rate.toFixed(2)}%`;
  const body = [
    `Gap Check weekly digest`,
    ``,
    `Deal: ${deal.name}`,
    `30-year rate (Freddie Mac): ${rate.toFixed(2)}%`,
    `Family can pay (Cal. HSC 50052.5): ${usd(g.familyPrice)}`,
    `Cost to create: ${usd(g.totalCost)}`,
    `Gap per home: ${usd(Math.max(g.gap, 0))}`,
    ``,
    ...(g.gap > 0 ? ["Who closes it:", ...v.closers.map((c, i) => `  ${i + 1}. ${c.name}: ${usd(c.amount)} (${c.certainty})`)] : ["It pencils."]),
    ``,
    `Synthetic deal. Not financial advice.`,
  ].join("\n");
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function Integrations() {
  const { deal, ratePct, assumptions } = useAppState();
  return (
    <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1 md:flex">
      <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Alerts</span>
      <a
        href="https://t.me/gapcheckclaudebot"
        target="_blank"
        title="Telegram: connected. Rate alerts and /gap, /whatif commands"
        className="relative rounded-full p-1 hover:bg-slate-100"
      >
        <TelegramLogo />
        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full border border-white bg-lime-500" />
      </a>
      <a href={emailHref(deal, ratePct, assumptions)} title="Email: send this deal's gap digest" className="rounded-full p-1 hover:bg-slate-100">
        <EmailLogo />
      </a>
    </div>
  );
}
