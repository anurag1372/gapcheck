"use client";

import Verdict from "@/components/Verdict";
import DemoIntro from "@/components/DemoIntro";
import { useState } from "react";
import { useAppState } from "@/components/AppState";
import { Card, Stat, Badge, NumberInput } from "@/components/ui";
import AskPanel from "@/components/AskPanel";
import { computeGap, stressTests, usd } from "@/lib/engine.mjs";
import { downloadProforma } from "@/lib/proforma.mjs";
import { STATUTE, RATE, INCOME_LIMITS, MARKET } from "@/data/sources.mjs";

export default function FinancePage() {
  const { deal, setDeal, ratePct, setRatePct, rateInfo, setRateInfo, assumptions, setAssumptions, resetDeal, persona } = useAppState();
  const [notice, setNotice] = useState("");
  const g = computeGap(deal, ratePct, assumptions);
  const st = stressTests(deal, ratePct, assumptions);
  const cat = STATUTE.categories[deal.category];

  const updateLine = (key, id, field, value) =>
    setDeal({ ...deal, [key]: deal[key].map((x) => (x.id === id ? { ...x, [field]: value } : x)) });

  const fetchLiveRate = async () => {
    setNotice("Checking Freddie Mac…");
    const res = await fetch("/api/rate");
    const data = await res.json();
    if (data.rate) {
      setRatePct(data.rate);
      setRateInfo({ date: data.date, live: true });
      setNotice(`Live rate loaded: ${data.rate}% (${data.date}).`);
    } else setNotice(data.error || "Could not load the live rate.");
  };

  const simulateThursday = async () => {
    const newRate = Math.round((ratePct + 0.14) * 100) / 100;
    const before = g;
    const after = computeGap(deal, newRate, assumptions);
    const text =
      `Gap Check alert (simulated Thursday)\n` +
      `Freddie Mac 30-year rate: ${ratePct}% -> ${newRate}%\n` +
      `Affordable family price: ${usd(before.familyPrice)} -> ${usd(after.familyPrice)}\n` +
      `Gap per home: ${usd(before.gap)} -> ${usd(after.gap)} (+${usd(after.gap - before.gap)})\n` +
      `Deal: ${deal.name}`;
    setRatePct(newRate);
    setRateInfo({ date: "simulated", live: false });
    const res = await fetch("/api/telegram/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setNotice(data.ok ? "Telegram alert sent to your test chat." : `Alert not sent: ${data.error}`);
  };

  return (
    <div className="space-y-6">
      <Verdict />
      <AskPanel />
      <DemoIntro />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Finance lead workspace</p>
          <h1 className="text-2xl font-semibold">{deal.name}</h1>
          <p className="text-sm text-amber-700">{deal.note}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() =>
              downloadProforma({ deal, ratePct, assumptions, rateDate: rateInfo.date, preparedFor: `${persona.name}, ${persona.role}, ${persona.org}` })
            } className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
            Generate pro forma (Excel)
          </button>
          <button onClick={simulateThursday} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white">
            Simulate Thursday rate alert
          </button>
          <button onClick={resetDeal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Reset
          </button>
        </div>
      </div>
      {notice && <p className="rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-800">{notice}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cost to create" value={usd(g.totalCost)} sub="Sum of the cost lines" />
        <Stat label="Family can pay" value={usd(g.familyPrice)} sub={`${cat.label}, household of ${g.family.cap.householdSize}`} tone="green" />
        <Stat label="Gap per home" value={usd(g.gap)} sub="Cost minus family price minus sources" tone={g.gap > 0 ? "red" : "green"} />
        <Stat label="Gap if unconfirmed money fails" value={usd(g.gapIfUnconfirmedFails)} sub={`${usd(g.atRisk)} not yet confirmed`} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-5">
          <div>
            <h2 className="font-semibold">How the family price is set</h2>
            <p className="mt-1 text-sm text-slate-600">
              Max housing cost = {g.family.cap.formula} = <b>{usd(g.family.cap.monthly)}/month</b> ({g.family.cap.cite}).
              The area median for a household of {g.family.cap.householdSize} comes from the{" "}
              <a className="underline" href={INCOME_LIMITS.url} target="_blank">{INCOME_LIMITS.table}</a>.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Bedrooms
              <select value={deal.bedrooms} onChange={(e) => setDeal({ ...deal, bedrooms: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1">
                {[0, 1, 2, 3, 4].map((b) => (
                  <option key={b} value={b}>{b === 0 ? "Studio" : `${b} bedrooms`}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Buyer income category
              <select value={deal.category} onChange={(e) => setDeal({ ...deal, category: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1">
                {Object.entries(STATUTE.categories).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span>
                30-year mortgage rate: <b>{ratePct.toFixed(2)}%</b>{" "}
                <span className="text-slate-500">
                  ({rateInfo.date === "simulated" ? "simulated" : `${RATE.series}, ${rateInfo.date}${rateInfo.live ? ", live" : ""}`})
                </span>
              </span>
              <button onClick={fetchLiveRate} className="text-sky-700 underline">Load live rate</button>
            </div>
            <input type="range" min="5" max="9" step="0.01" value={ratePct} onChange={(e) => setRatePct(Number(e.target.value))} className="mt-2 w-full accent-emerald-600" />
            <p className="text-xs text-slate-500">
              Every +0.25% adds about <b>{usd(st.perQuarterPoint)}</b> to the gap. Each month of delay costs about <b>{usd(st.perMonthDelay)}</b> (ASSUMPTION).
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Loan assumptions (each one an ASSUMPTION)</h3>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["termYears", "Term (yrs)"],
                ["downPaymentPct", "Down %"],
                ["propertyTaxPct", "Tax %"],
                ["insuranceMonthly", "Insurance/mo"],
                ["hoaMonthly", "HOA/mo"],
              ].map(([k, label]) => (
                <label key={k} className="text-xs text-slate-600">
                  {label}
                  <NumberInput value={assumptions[k]} step={k.includes("Pct") ? 0.1 : 1} onChange={(v) => setAssumptions({ ...assumptions, [k]: v })} />
                </label>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-2">
          <h2 className="font-semibold">Why this matters</h2>
          <p className="text-sm text-slate-600">
            In Orange County only <b>{MARKET.shareCanAfford}%</b> of households can afford the median home of <b>{usd(MARKET.medianPrice)}</b>, which needs{" "}
            <b>{usd(MARKET.minQualifyingIncome)}</b> a year.
          </p>
          <p className="text-sm text-slate-600">
            This family can pay <b>{usd(g.familyPrice)}</b>. The difference has to come from somewhere.
          </p>
          <a className="text-xs underline text-slate-500" href={MARKET.url} target="_blank">{MARKET.label}</a>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Cost to create (uses)</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {deal.costs.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="py-2 pr-2">
                    {c.label}
                    <p className="text-xs text-slate-400">{c.basis}</p>
                  </td>
                  <td className="w-36 py-2">
                    <NumberInput value={c.amount} step={1000} onChange={(v) => updateLine("costs", c.id, "amount", v)} />
                  </td>
                </tr>
              ))}
              <tr className="border-t border-slate-300 font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2">{usd(g.totalCost)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="font-semibold">Who pays (sources)</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="py-2">Family price (derived)</td>
                <td className="py-2"><Badge status="confirmed" /></td>
                <td className="py-2 text-right">{usd(g.familyPrice)}</td>
              </tr>
              {deal.sources.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-2 pr-2">
                    {s.label}
                    <p className="text-xs text-slate-400">Paid during: {s.phase}</p>
                  </td>
                  <td className="py-2">
                    <select value={s.status} onChange={(e) => updateLine("sources", s.id, "status", e.target.value)} className="rounded border border-slate-300 text-xs">
                      {["confirmed", "unconfirmed", "competitive"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="w-32 py-2">
                    <NumberInput value={s.amount} step={1000} onChange={(v) => updateLine("sources", s.id, "amount", v)} />
                  </td>
                </tr>
              ))}
              <tr className="border-t border-slate-300 font-semibold">
                <td className="py-2">Gap to fundraise</td>
                <td />
                <td className={`py-2 text-right ${g.gap > 0 ? "text-red-600" : "text-emerald-600"}`}>{usd(g.gap)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

    </div>
  );
}
