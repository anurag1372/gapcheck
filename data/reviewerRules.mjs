const FEEDBACK = "Bank of America Affordable Housing Challenge 2026, reviewer feedback session (finance professionals reviewing a 61-unit LA County LIHTC rental proposal). Practitioner judgment, not law; not verified for Orange County ownership deals.";
const MODEL = "Bank of America Affordable Housing Challenge 2026, competition model rules (Summary sheet). Competition rules, not law.";

export const REVIEWER_RULES = [
  { id: "sources-uses", rule: "Sources must equal uses, at construction and at permanent.", source: MODEL },
  { id: "summary-adds-up", rule: "The executive summary numbers must add up and match the budget. Reviewers flagged a summary that did not.", source: FEEDBACK },
  { id: "consistency", rule: "Unit counts, stories, parking, DSCR and loan amounts must match across every section and the model. Reviewers caught several that did not.", source: FEEDBACK },
  { id: "contingency", rule: "Hard cost contingency at least 5% for new construction, 10% for rehab.", source: MODEL },
  { id: "soft-costs", rule: "Soft costs are typically 5–10% of total costs. $250k on a large deal was called low.", source: FEEDBACK },
  { id: "construction-cost", rule: "New construction costs were called low; typically about $500k per unit (LA County rental, 2026).", source: FEEDBACK },
  { id: "remediation", rule: "If there is demolition, budget asbestos and lead remediation. It was missing.", source: FEEDBACK },
  { id: "county-permanent", rule: "County soft money (e.g. LACDA) is usually permanent financing, not construction financing. Don't count it during construction.", source: FEEDBACK },
  { id: "committed-first", rule: "Each funder wants to see the others committed first. Applying for tax credits before local awards are in is hard.", source: FEEDBACK },
  { id: "confirm-grants", rule: "Confirm a philanthropic fund's actual balance before counting the grant.", source: FEEDBACK },
  { id: "timeline", rule: "Entitlements and permits realistically take about 6 months each, and drawings start after entitlements. That adds at least a year.", source: FEEDBACK },
  { id: "dscr", rule: "Debt service coverage on must-pay debt at least 1.15x.", source: MODEL },
  { id: "dev-fee", rule: "A developer fee that is low for the deal size is a flag. Don't defer much of it.", source: FEEDBACK },
  { id: "union-labor", rule: "Some regional funds (LACAHSA, projects over 40 units) require union labor at roughly 15% above prevailing wage. Budget for it.", source: FEEDBACK },
];

export function reviewDeal(deal, gap) {
  const findings = [];
  const add = (ruleId, severity, finding) => findings.push({ ruleId, severity, finding, rule: REVIEWER_RULES.find((r) => r.id === ruleId) });
  const cost = (id) => Number(deal.costs.find((c) => c.id === id)?.amount || 0);
  const total = gap.totalCost;

  if (Math.abs(gap.gap) > 1) add("sources-uses", "high", `Sources fall short of uses by $${Math.round(gap.gap).toLocaleString()}. The gap must be closed before submission.`);
  const unconfirmed = deal.sources.filter((s) => s.status !== "confirmed");
  if (unconfirmed.length)
    add("committed-first", "high", `${unconfirmed.map((s) => s.label).join(", ")} ($${gap.atRisk.toLocaleString()}) not confirmed. Gap becomes $${Math.round(gap.gapIfUnconfirmedFails).toLocaleString()} if it falls through.`);
  if (!deal.costs.some((c) => /contingen/i.test(c.label)))
    add("contingency", "high", "No contingency line in the budget. Add at least 10% of construction for a rehab, 5% for new construction.");
  const fees = cost("fees");
  if (total && fees) {
    const pct = (fees / total) * 100;
    if (pct < 5) add("soft-costs", "medium", `Fees and soft costs are ${pct.toFixed(1)}% of total, below the 5–10% reviewers expect.`);
  }
  if (cost("sitework") === 0) add("remediation", "medium", "No site work, demolition or remediation budgeted. If anything is demolished, add asbestos and lead remediation.");
  if (cost("utilities") === 0) add("consistency", "low", "No utility connection line (SCE, water, sewer). Often missed, and it shows up later as a cost overrun.");
  deal.sources
    .filter((s) => s.phase === "construction" && /public|county|city|subsid/i.test(s.label))
    .forEach((s) => add("county-permanent", "medium", `${s.label} is counted during construction. Public soft money usually funds at permanent, so construction may need a bridge.`));
  return findings;
}
