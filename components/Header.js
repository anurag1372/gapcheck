"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PERSONAS } from "@/data/personas.mjs";
import { useAppState } from "./AppState";
import { downloadProforma } from "@/lib/proforma.mjs";
import Integrations from "./Integrations";

export default function Header() {
  const { persona, setPersonaId, deal, ratePct, assumptions, rateInfo } = useAppState();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const switchTo = (p) => {
    setPersonaId(p.id);
    setOpen(false);
    router.push(p.path);
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href={persona.path} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">G</span>
          <span className="whitespace-nowrap text-lg font-semibold text-slate-900">Gap Check</span>
          <span className="hidden text-sm text-slate-500 lg:inline">Does it pencil, and who closes the gap?</span>
        </Link>
        <div className="flex items-center gap-3">
        <Integrations />
        <button
          onClick={() =>
            downloadProforma({ deal, ratePct, assumptions, rateDate: rateInfo.date, preparedFor: `${persona.name}, ${persona.role}, ${persona.org}` })
          }
          className="flex items-center gap-2 shrink-0 whitespace-nowrap rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Generate pro forma
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 rounded-full border border-slate-200 py-1 pl-1 pr-4 hover:bg-slate-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
              {persona.initials}
            </span>
            <span className="text-left">
              <span className="block text-sm font-medium text-slate-900">{persona.name}</span>
              <span className="block text-xs text-slate-500">{persona.role}</span>
            </span>
          </button>
          {open && (
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <p className="px-3 py-2 text-xs uppercase tracking-wide text-slate-400">Switch demo persona</p>
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => switchTo(p)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 ${p.id === persona.id ? "bg-emerald-50" : ""}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                    {p.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{p.name}</span>
                    <span className="block text-xs text-slate-500">
                      {p.role} · {p.org}
                    </span>
                  </span>
                </button>
              ))}
              <p className="px-3 pt-2 text-xs text-slate-400">Fictional personas for the demo. No real accounts.</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
