"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAppState } from "./AppState";

const ACCENT = { emerald: "bg-emerald-600", violet: "bg-violet-600", rose: "bg-rose-600", sky: "bg-sky-600" };

export default function DemoChecklist() {
  const { persona } = useAppState();
  const pathname = usePathname();
  const [done, setDone] = useState(() => new Set());
  const items = persona.checklist || [];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDone(new Set());
    const check = () => {
      const line = window.innerHeight * 0.75;
      setDone((prev) => {
        let changed = false;
        const next = new Set(prev);
        document.querySelectorAll("[data-check]").forEach((el) => {
          const id = el.getAttribute("data-check");
          if (!next.has(id) && el.getBoundingClientRect().top < line) {
            next.add(id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    };
    const t = setTimeout(check, 400);
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", check);
    };
  }, [pathname, persona.id]);

  if (!items.length) return null;
  const count = items.filter((i) => done.has(i.id)).length;
  const accent = ACCENT[persona.theme] || ACCENT.emerald;

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-52 lg:w-64">
      <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl ring-1 ring-black/5 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{persona.name} gets</p>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${accent}`} style={{ width: `${(count / items.length) * 100}%` }} />
        </div>
        <ul className="mt-3 space-y-1.5 lg:space-y-2.5">
          {items.map((it) => {
            const on = done.has(it.id);
            return (
              <li key={it.id} className="flex gap-2.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-all duration-300 ${
                    on ? `${accent} scale-110 border-transparent text-white` : "border-slate-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span>
                  <span className={`block text-sm font-medium leading-5 transition-colors ${on ? "text-slate-900" : "text-slate-400"}`}>{it.label}</span>
                  <span className={`block text-xs leading-4 transition-colors max-lg:hidden ${on ? "text-slate-500" : "text-slate-300"}`}>{it.means}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs font-medium text-slate-500">
          {count} of {items.length} solved
        </p>
      </div>
    </aside>
  );
}
