"use client";

import { useState } from "react";
import { useAppState } from "./AppState";

const LABELS = {
  bedrooms: "Bedrooms",
  land: "Land and building",
  time_costs: "Time costs",
  construction: "Construction",
  fees: "Fees and soft costs",
  utilities: "Utility connections",
  sitework: "Site work",
  public_subsidy: "Public subsidy",
  rent_income: "Rent while waiting",
  down_payment_pct: "Down payment %",
  property_tax_pct: "Property tax %",
  insurance_monthly: "Insurance / month",
  hoa_monthly: "HOA / month",
  household_size: "Household size",
  annual_income: "Annual income",
  city: "City",
};
const COST_KEYS = { land: "land", time_costs: "time", construction: "construction", fees: "fees", utilities: "utilities", sitework: "sitework" };
const SOURCE_KEYS = { public_subsidy: "subsidy", rent_income: "rent" };
const ASSUMPTION_KEYS = { down_payment_pct: "downPaymentPct", property_tax_pct: "propertyTaxPct", insurance_monthly: "insuranceMonthly", hoa_monthly: "hoaMonthly" };

export default function AutofillBeta({ mode }) {
  const { deal, setDeal, assumptions, setAssumptions, household, setHousehold } = useAppState();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const apply = (fields) => {
    if (mode === "finance") {
      const next = { ...deal };
      if (fields.bedrooms) next.bedrooms = Number(fields.bedrooms.value);
      next.costs = deal.costs.map((c) => {
        const k = Object.keys(COST_KEYS).find((key) => COST_KEYS[key] === c.id);
        return k && fields[k] ? { ...c, amount: Number(fields[k].value), basis: `From your document: "${fields[k].quote}"` } : c;
      });
      next.sources = deal.sources.map((s) => {
        const k = Object.keys(SOURCE_KEYS).find((key) => SOURCE_KEYS[key] === s.id);
        return k && fields[k] ? { ...s, amount: Number(fields[k].value) } : s;
      });
      setDeal(next);
      const a = { ...assumptions };
      Object.entries(ASSUMPTION_KEYS).forEach(([k, target]) => fields[k] && (a[target] = Number(fields[k].value)));
      setAssumptions(a);
    } else {
      setHousehold({
        size: fields.household_size ? Number(fields.household_size.value) : household.size,
        income: fields.annual_income ? Number(fields.annual_income.value) : household.income,
        city: fields.city ? String(fields.city.value) : household.city,
      });
    }
  };

  const run = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    try {
      const res = await fetch("/api/autofill", { method: "POST", body: fd });
      const data = await res.json();
      if (data.fields) apply(data.fields);
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setBusy(false);
  };

  const found = result?.fields ? Object.entries(result.fields).filter(([, v]) => v && v.value != null) : [];

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-800">Fill this in from your documents</h3>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">Beta</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {mode === "finance"
          ? "Upload a budget, pro forma or term sheet. Claude reads it and fills in the costs, sources and loan terms it finds, with the exact quote for each."
          : "Upload a pay stub, tax return or application. Claude fills in household size, income and city. Nothing is stored."}
      </p>
      <form onSubmit={run} className="mt-3 flex flex-wrap items-center gap-3">
        <input type="file" accept=".pdf,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
        <button disabled={!file || busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40">
          {busy ? "Reading…" : "Read and fill"}
        </button>
      </form>
      {result?.error && <p className="mt-3 text-sm text-red-600">{result.error}</p>}
      {result?.fields && (
        <div className="mt-3 text-sm">
          {found.length ? (
            <>
              <p className="font-medium text-emerald-700">Filled {found.length} field{found.length === 1 ? "" : "s"}. Check them above.</p>
              <ul className="mt-2 space-y-1">
                {found.map(([k, v]) => (
                  <li key={k} className="text-slate-600">
                    <b>{LABELS[k] || k}:</b> {String(v.value)} <span className="text-slate-400">· “{v.quote}”</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-slate-500">Nothing matching was found in that document.</p>
          )}
        </div>
      )}
    </div>
  );
}
