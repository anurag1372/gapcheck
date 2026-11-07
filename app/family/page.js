"use client";

import AutofillBeta from "@/components/AutofillBeta";
import DemoIntro from "@/components/DemoIntro";
import AskPanel from "@/components/AskPanel";
import { useAppState } from "@/components/AppState";
import { Card, Stat, Badge, NumberInput } from "@/components/ui";
import { affordablePrice, incomeCategoryFor, rankPrograms, usd } from "@/lib/engine.mjs";
import { INCOME_LIMITS, MARKET } from "@/data/sources.mjs";

const CITIES = ["Anaheim", "Costa Mesa", "Fullerton", "Garden Grove", "Huntington Beach", "Irvine", "Orange", "Santa Ana", "Tustin", "Other OC city"];

export default function FamilyPage() {
  const { ratePct, assumptions, household, setHousehold } = useAppState();
  const { size, income, city } = household;
  const setSize = (v) => setHousehold({ ...household, size: v });
  const setIncome = (v) => setHousehold({ ...household, income: v });
  const setCity = (v) => setHousehold({ ...household, city: v });

  const cat = incomeCategoryFor(income, size);
  const bedrooms = Math.max(size - 1, 0);
  const priced = cat.key ? affordablePrice({ category: cat.key, bedrooms, ratePct, assumptions }) : null;
  const ranked = rankPrograms({ income, householdSize: size, city, price: priced ? priced.price : 0 });
  const stackTotal = ranked.filter((p) => p.usable).reduce((t, p) => t + (p.estimate || 0), 0);

  return (
    <div className="space-y-6">
      <DemoIntro />
      <AskPanel
        context={{
          householdSize: size,
          annualIncome: income,
          city,
          incomeCategory: cat.label,
          maxMonthlyHousingCost: priced ? usd(priced.cap.monthly) : null,
          affordablePrice: priced ? usd(priced.price) : null,
          rankedPrograms: ranked.map((p) => ({ rank: p.rank, name: p.name, reason: p.reason })),
          eligibilityNote: "Program income checks use the HCD state table; WISH and AHP use HUD limits, so treat as approximate",
        }}
      />
      <div>
        <p className="text-sm text-slate-500">Buyer family</p>
        <h1 className="text-2xl font-semibold">What can we afford, and what help can we stack?</h1>
        <p className="text-sm text-slate-500">No Social Security number, no documents. An estimate, not a loan approval.</p>
      </div>

      <Card className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          People in household
          <select value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Annual household income
          <NumberInput value={income} step={1000} onChange={setIncome} className="mt-1" />
        </label>
        <label className="text-sm">
          City
          <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Income category" value={cat.label} sub={`Limit for ${size} people: ${usd(cat.limit)} (${INCOME_LIMITS.table})`} />
        <Stat label="Max monthly housing cost" value={priced ? usd(priced.cap.monthly) : "n/a"} sub={priced ? `${priced.cap.formula} (${priced.cap.cite})` : "Above the program categories"} />
        <Stat label="Affordable price today" value={priced ? usd(priced.price) : "n/a"} sub={`At ${ratePct}% for a ${bedrooms}-bedroom home. Tax, insurance, down payment are ASSUMPTIONS`} tone="green" />
      </div>

      <Card>
        <p className="text-sm text-slate-600">
          For comparison, the median Orange County home is <b>{usd(MARKET.medianPrice)}</b> and needs <b>{usd(MARKET.minQualifyingIncome)}</b> a year. Only{" "}
          <b>{MARKET.shareCanAfford}%</b> of households can afford it ({MARKET.label}).
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-semibold">Help to try, ranked for you</h2>
            <p className="text-xs text-slate-500">
              Ranked by: open right now, then whether your income likely qualifies, then how much it could bring. Income check is approximate (HCD
              state table; some programs use HUD limits). Confirm with a housing counselor or lender.
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-emerald-700">Open help, if they combine</p>
            <p className="text-lg font-semibold text-emerald-700">up to {usd(stackTotal)}</p>
          </div>
        </div>
        <ol className="mt-4 space-y-2">
          {ranked.map((p) => (
            <li
              key={p.id}
              className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3 ${p.rank === 1 && p.usable ? "border-emerald-300 bg-emerald-50/60" : p.usable ? "border-slate-200" : "border-slate-100 bg-slate-50 opacity-70"}`}
            >
              <div className="flex max-w-2xl gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${p.usable ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"}`}>
                  {p.rank}
                </span>
                <div>
                  <p className="font-medium">
                    {p.name} <span className="text-xs text-slate-500">· {p.type}</span>
                    {p.rank === 1 && p.usable && <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">Start here</span>}
                  </p>
                  <p className="text-xs font-medium text-slate-700">{p.reason}</p>
                  <p className="mt-1 text-sm text-slate-600">{p.terms}</p>
                  <p className="text-xs text-slate-500">{p.timing}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={p.status} />
                <a href={p.url} target="_blank" className="text-xs text-sky-700 underline">Source</a>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <AutofillBeta mode="family" />
    </div>
  );
}
