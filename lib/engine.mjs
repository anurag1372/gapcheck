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

export function whoClosesTheGap(deal, g) {
  const confirmed = deal.sources.filter((s) => s.status === "confirmed").reduce((t, s) => t + Number(s.amount || 0), 0);
  const parts = [
    { key: "family", label: "Family pays", amount: g.familyPrice, tone: "family" },
    { key: "confirmed", label: "Confirmed sources", amount: confirmed, tone: "confirmed" },
    { key: "unconfirmed", label: "Not yet confirmed", amount: g.atRisk, tone: "unconfirmed" },
    { key: "gap", label: "Still to raise", amount: Math.max(g.gap, 0), tone: "gap" },
  ];

  let left = Math.max(g.gap, 0);
  const closers = [];
  const candidates = PROGRAMS.filter((p) => !p.city && (p.status === "open" || p.status === "lottery") && (p.max || p.pctOfPrice))
    .map((p) => {
      const byPct = p.pctOfPrice ? (g.familyPrice * p.pctOfPrice) / 100 : Infinity;
      return { ...p, cap: Math.min(byPct, p.max ?? Infinity) };
    })
    .sort((a, b) => (a.status === b.status ? b.cap - a.cap : a.status === "open" ? -1 : 1));
  for (const p of candidates) {
    if (left <= 0) break;
    const take = Math.min(left, p.cap);
    closers.push({
      name: p.name,
      amount: take,
      certainty: p.status === "open" ? "Open now" : "Lottery, if drawn",
      how:
        p.status === "open"
          ? "Buyer-side help layered into the sale, so the family can pay more at the same monthly cost"
          : "Not guaranteed. If the family is drawn, this could replace the donor ask below",
      url: p.url,
    });
    if (p.status === "open") left -= take;
  }
  const openTotal = closers.filter((c) => c.certainty === "Open now").reduce((t, c) => t + c.amount, 0);
  const remainder = Math.ceil(Math.max(g.gap - openTotal, 0));
  if (remainder > 0)
    closers.push({ name: "Donors and philanthropy", amount: remainder, certainty: "To fundraise", how: "What is left after open programs. This is the ask." });

  return {
    pencils: g.gap <= 0,
    pencilsIfAllLands: g.gapIfUnconfirmedFails <= 0,
    parts,
    closers,
    remainder,
    coveredPct: g.totalCost ? Math.min(100, ((g.familyPrice + confirmed) / g.totalCost) * 100) : 0,
  };
}

export function upsertSource(deal, source) {
  const exists = deal.sources.some((s) => s.id === source.id);
  return { ...deal, sources: exists ? deal.sources.map((s) => (s.id === source.id ? { ...s, ...source } : s)) : [...deal.sources, source] };
}

export function rateToPencil(deal, assumptions) {
  if (computeGap(deal, 3, assumptions).gap > 0) return null;
  let lo = 3;
  let hi = 12;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (computeGap(deal, mid, assumptions).gap > 0) hi = mid;
    else lo = mid;
  }
  return Math.floor(lo * 100) / 100;
}

export function leversToPencil(deal, ratePct, assumptions) {
  const g = computeGap(deal, ratePct, assumptions);
  if (g.gap <= 0) return [];
  const v = whoClosesTheGap(deal, g);
  const levers = [];
  const gapAfter = (d, r = ratePct) => computeGap(d, r, assumptions).gap;

  const openPrograms = v.closers.filter((c) => c.certainty === "Open now");
  const aid = Math.round(openPrograms.reduce((t, c) => t + c.amount, 0));
  if (aid > 0) {
    const d = upsertSource(deal, { id: "buyerAid", label: `Buyer-side help: ${openPrograms.map((c) => c.name).join(" + ")}`, amount: aid, status: "unconfirmed", phase: "at sale" });
    levers.push({ id: "aid", title: "Layer in open down-payment programs", detail: `${openPrograms.map((c) => c.name).join(" + ")} add ${usd(aid)} at sale`, newGap: gapAfter(d), deal: d });
  }

  const withAid = levers[0]?.deal || deal;
  const rest = Math.ceil(Math.max(gapAfter(withAid), 0));
  if (rest > 0) {
    const d = upsertSource(withAid, { id: "donor", label: "Donor gift", amount: rest, status: "unconfirmed", phase: "construction" });
    levers.push({ id: "donor", title: aid > 0 ? "Programs + a donor gift" : "Raise a donor gift", detail: `${aid > 0 ? `Open programs, then ` : ""}a ${usd(rest)} donor ask closes the rest`, newGap: gapAfter(d), deal: d, recommended: true });
  }

  const monthly = Number(deal.carryingCostMonthly || 0);
  const time = deal.costs.find((c) => c.id === "time");
  if (monthly && time?.amount) {
    const months = Math.min(Math.ceil(g.gap / monthly), Math.floor(time.amount / monthly));
    if (months > 0) {
      const d = { ...deal, costs: deal.costs.map((c) => (c.id === "time" ? { ...c, amount: c.amount - months * monthly } : c)) };
      levers.push({ id: "faster", title: `Sell ${months} month${months === 1 ? "" : "s"} sooner`, detail: `Cuts waiting costs by ${usd(months * monthly)} (ASSUMPTION: ${usd(monthly)}/month)`, newGap: gapAfter(d), deal: d });
    }
  }

  if (deal.category !== "moderate") {
    const d = { ...deal, category: "moderate" };
    levers.push({ id: "moderate", title: "Serve a moderate-income buyer instead", detail: "Higher legal price cap. Trade-off: helps a less-poor family", newGap: gapAfter(d), deal: d });
  }

  const r = rateToPencil(deal, assumptions);
  levers.push({
    id: "rate",
    title: r ? `Wait for rates to fall to ${r}%` : "Wait for lower rates",
    detail: r ? `Today ${ratePct}%. Not in your control, but the Telegram alert tells you the week it happens` : "Rates alone can't close this gap",
    newGap: r ? 0 : g.gap,
    rate: r,
  });

  return levers;
}

export const usd = (n) => {
  const r = Math.round(n);
  return r < 0 ? `-$${Math.abs(r).toLocaleString("en-US")}` : `$${r.toLocaleString("en-US")}`;
};
