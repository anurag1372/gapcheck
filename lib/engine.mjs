import { INCOME_LIMITS, STATUTE, DEFAULT_ASSUMPTIONS, PROGRAMS } from "../data/sources.mjs";

export const householdSizeForBedrooms = (bedrooms) => Math.min(Math.max(bedrooms + 1, 1), 8);

export function maxMonthlyHousingCost(category, bedrooms) {
  const cat = STATUTE.categories[category];
  const size = householdSizeForBedrooms(bedrooms);
  const amiAdjusted = INCOME_LIMITS.rows.median[size - 1];
  const annual = cat.incomeShare * cat.amiShare * amiAdjusted;
  return {
    monthly: annual / 12,
    annual,
    householdSize: size,
    amiAdjusted,
    formula: `${cat.incomeShare * 100}% x ${cat.amiShare * 100}% x $${amiAdjusted.toLocaleString()} / 12`,
    cite: `HSC 50052.5${cat.cite}`,
  };
}

export function monthlyPaymentPerDollar(ratePct, termYears) {
  const r = ratePct / 100 / 12;
  const n = termYears * 12;
  return r / (1 - Math.pow(1 + r, -n));
}

export function affordablePrice({ category, bedrooms, ratePct, assumptions = DEFAULT_ASSUMPTIONS }) {
  const a = { ...DEFAULT_ASSUMPTIONS, ...assumptions };
  const cap = maxMonthlyHousingCost(category, bedrooms);
  const loanShare = 1 - a.downPaymentPct / 100;
  const perDollar = loanShare * monthlyPaymentPerDollar(ratePct, a.termYears) + a.propertyTaxPct / 100 / 12;
  const available = cap.monthly - a.insuranceMonthly - a.hoaMonthly;
  const price = Math.max(0, available / perDollar);
  return { price, cap, ratePct, assumptions: a };
}

export function computeGap(deal, ratePct, assumptions) {
  const family = affordablePrice({ category: deal.category, bedrooms: deal.bedrooms, ratePct, assumptions });
  const totalCost = deal.costs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const sourcesTotal = deal.sources.reduce((s, x) => s + Number(x.amount || 0), 0);
  const atRisk = deal.sources
    .filter((x) => x.status !== "confirmed")
    .reduce((s, x) => s + Number(x.amount || 0), 0);
  const gap = totalCost - family.price - sourcesTotal;
  return { totalCost, familyPrice: family.price, family, sourcesTotal, gap, gapIfUnconfirmedFails: gap + atRisk, atRisk };
}

export function stressTests(deal, ratePct, assumptions) {
  const base = computeGap(deal, ratePct, assumptions).gap;
  const up = computeGap(deal, ratePct + 0.25, assumptions).gap;
  return {
    perQuarterPoint: up - base,
    perMonthDelay: Number(deal.carryingCostMonthly || 0),
  };
}

export function incomeCategoryFor(income, householdSize) {
  const i = Math.min(Math.max(householdSize, 1), 8) - 1;
  const r = INCOME_LIMITS.rows;
  if (income <= r.extremelyLow[i]) return { key: "extremelyLow", label: "Extremely low income", limit: r.extremelyLow[i] };
  if (income <= r.veryLow[i]) return { key: "veryLow", label: "Very low income", limit: r.veryLow[i] };
  if (income <= r.low[i]) return { key: "lower", label: "Low income", limit: r.low[i] };
  if (income <= r.moderate[i]) return { key: "moderate", label: "Moderate income", limit: r.moderate[i] };
  return { key: null, label: "Above moderate income", limit: r.moderate[i] };
}

export function programsFor({ income, householdSize, city }) {
  const median = INCOME_LIMITS.rows.median[Math.min(Math.max(householdSize, 1), 8) - 1];
  const amiPct = (income / median) * 100;
  return PROGRAMS.filter((p) => !p.city || p.city === city).map((p) => ({
    ...p,
    incomeOk: p.maxAmiPct ? amiPct <= p.maxAmiPct : null,
    amiPct,
  }));
}

const STATUS_WEIGHT = { open: 3, lottery: 2, competitive: 1, unconfirmed: 1, closed: 0 };
const STATUS_REASON = {
  open: "Open now",
  lottery: "Lottery: you may not be drawn",
  competitive: "Competitive: next round is 2027",
  unconfirmed: "Current round not confirmed",
  closed: "No funds right now",
};

export function rankPrograms({ income, householdSize, city, price }) {
  return programsFor({ income, householdSize, city })
    .map((p) => {
      const byPct = p.pctOfPrice ? (price * p.pctOfPrice) / 100 : null;
      const estimate = byPct != null ? Math.min(byPct, p.max ?? Infinity) : p.max ?? null;
      const usable = p.status === "open" && p.incomeOk !== false;
      const score = STATUS_WEIGHT[p.status] * 1e7 + (p.incomeOk === false ? -2e7 : 0) + (estimate || 0);
      const reasons = [STATUS_REASON[p.status]];
      if (p.incomeOk === false) reasons.push("income likely above the limit");
      if (p.incomeOk === true) reasons.push("income likely qualifies");
      if (estimate) reasons.push(`up to about ${usd(estimate)}${byPct != null ? ` at a ${usd(price)} price` : ""}`);
      return { ...p, estimate, usable, score, reason: reasons.join(" · ") };
    })
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

export const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
