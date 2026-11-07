export const SYNTHETIC_DEAL = {
  name: "SYNTHETIC one-home deal (organizers' worked example)",
  note: "Made up for testing. Every dollar is an ASSUMPTION. Not a real project, city, program or buyer.",
  source: "claude-impact-lab-uci/lanes/3-fund-it/data/synthetic-example-deal.json",
  bedrooms: 3,
  category: "lower",
  monthsToSale: 12,
  carryingCostMonthly: 7083,
  costs: [
    { id: "land", label: "Land and building purchase", amount: 360000, basis: "ASSUMPTION (synthetic)" },
    { id: "time", label: "Time costs while waiting", amount: 85000, basis: "ASSUMPTION (synthetic)" },
    { id: "construction", label: "Construction and repairs", amount: 40000, basis: "ASSUMPTION (synthetic)" },
    { id: "fees", label: "Fees, design, legal, sales", amount: 50000, basis: "ASSUMPTION (synthetic)" },
    { id: "utilities", label: "Utility connections (SCE, water, sewer)", amount: 0, basis: "Not in synthetic deal. Add a real quote" },
    { id: "sitework", label: "Site work and demolition, incl. remediation", amount: 0, basis: "Not in synthetic deal. Add a real quote" },
  ],
  sources: [
    { id: "subsidy", label: "Public subsidies (placeholder)", amount: 100000, status: "unconfirmed", phase: "construction" },
    { id: "rent", label: "Rent earned while waiting", amount: 55000, status: "confirmed", phase: "construction" },
  ],
};
