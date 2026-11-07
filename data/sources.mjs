export const INCOME_LIMITS = {
  county: "Orange County",
  ami: 138600,
  table: "HCD 2026 State Income Limits (revised June 23, 2026), page 11",
  url: "https://www.hcd.ca.gov/sites/default/files/docs/grants-and-funding/income-limits-2026.pdf",
  checked: "2026-11-07",
  rows: {
    acutelyLow: [14550, 16650, 18700, 20800, 22450, 24150, 25800, 27450],
    extremelyLow: [39100, 44700, 50300, 55850, 60350, 64800, 69300, 73750],
    veryLow: [65150, 74450, 83750, 93050, 100500, 107950, 115400, 122850],
    low: [104200, 119100, 134000, 148850, 160800, 172700, 184600, 196500],
    median: [97000, 110900, 124750, 138600, 149700, 160800, 171850, 182950],
    moderate: [116400, 133050, 149650, 166300, 179600, 192900, 206200, 219500],
  },
};

export const STATUTE = {
  name: "Health and Safety Code 50052.5(b), owner-occupied, assisted on or after Jan 1, 1991",
  url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=HSC&sectionNum=50052.5",
  checked: "2026-11-07",
  categories: {
    extremelyLow: { label: "Extremely low income", incomeShare: 0.3, amiShare: 0.3, cite: "(b)(1)" },
    veryLow: { label: "Very low income", incomeShare: 0.3, amiShare: 0.5, cite: "(b)(2)" },
    lower: { label: "Lower income", incomeShare: 0.3, amiShare: 0.7, cite: "(b)(3)" },
    moderate: { label: "Moderate income", incomeShare: 0.35, amiShare: 1.1, cite: "(b)(4)" },
  },
  familySizeRule: "(h): household size = bedrooms + 1 (studio = 1, 3 bedrooms = 4)",
};

export const RATE = {
  series: "Freddie Mac PMMS 30-year fixed",
  url: "https://www.freddiemac.com/pmms/docs/PMMS_history.csv",
  checked: "2026-11-07",
  history: [
    { date: "2026-10-08", rate: 7.4 },
    { date: "2026-10-22", rate: 7.32 },
    { date: "2026-10-29", rate: 7.24 },
    { date: "2026-11-05", rate: 7.18 },
  ],
};

export const MARKET = {
  label: "C.A.R. Housing Affordability Index, Orange County, Q3 2026",
  url: "https://www.car.org/marketdata/data/haitraditional",
  checked: "2026-11-07",
  shareCanAfford: 15,
  medianPrice: 1470000,
  minQualifyingIncome: 374400,
};

export const DEFAULT_ASSUMPTIONS = {
  termYears: 30,
  downPaymentPct: 3,
  propertyTaxPct: 1.1,
  insuranceMonthly: 150,
  hoaMonthly: 0,
};

export const PROGRAMS = [
  {
    id: "wish",
    name: "FHLBank SF WISH",
    type: "Down-payment grant",
    terms: "4-to-1 matching grant up to $32,837. At or below 80% HUD AMI. First-time buyer. Buyer contributes own savings.",
    max: 32837,
    maxAmiPct: 80,
    status: "open",
    timing: "$13M in the 2026 program. Member banks can join through March 12, 2027.",
    url: "https://fhlbsf.com/products/community-programs-grants/wish",
  },
  {
    id: "myhome",
    name: "CalHFA MyHome",
    type: "Deferred junior loan",
    terms: "Up to the lesser of 3.5% (FHA) or 3% (conventional) of price or appraised value. First-time buyer, homebuyer education.",
    pctOfPrice: 3.5,
    status: "open",
    timing: "Ongoing through CalHFA-approved lenders.",
    url: "https://www.calhfa.ca.gov/homebuyer/programs/myhome.htm",
  },
  {
    id: "dream",
    name: "CalHFA Dream For All",
    type: "Shared appreciation loan",
    terms: "Up to 20%, max $150,000. First-generation buyer. Repay loan plus a share of appreciation.",
    pctOfPrice: 20,
    max: 150000,
    status: "lottery",
    timing: "Round-based randomized drawing. Last round of vouchers released May 20, 2026. Not guaranteed.",
    url: "https://calhfa.ca.gov/dream/",
  },
  {
    id: "santaana",
    name: "Santa Ana My First Home",
    type: "Deferred 0% loan",
    terms: "Up to $120,000. Currently 80% AMI households only. Credit 640+, 3% seasoned savings, 8-hour course.",
    max: 120000,
    maxAmiPct: 80,
    city: "Santa Ana",
    status: "open",
    timing: "First come, first served. Income limits as of June 2026.",
    url: "https://santa-ana.org/my-first-home",
  },
  {
    id: "ahp",
    name: "FHLBank SF AHP",
    type: "Competitive project grant",
    terms: "Owner-occupied: households at or below 80% AMI. 5-year retention. Applied for through a member bank.",
    maxAmiPct: 80,
    status: "competitive",
    timing: "2026 round already awarded June 22. Next chance is the 2027 competition.",
    url: "https://fhlbsf.com/products/community-programs-grants/ahp",
  },
  {
    id: "calhome",
    name: "HCD CalHome (Homeownership Super NOFA)",
    type: "Grant to nonprofit, loans to buyers",
    terms: "Grants to agencies and nonprofits for first-time buyer down-payment loans and self-help.",
    status: "unconfirmed",
    timing: "Current round not confirmed on the HOSN page.",
    url: "https://www.hcd.ca.gov/funding/hosn",
  },
  {
    id: "ochft",
    name: "OC Housing Finance Trust NOFA",
    type: "Project funding",
    terms: "2024 NOFA extended through July 2026.",
    status: "closed",
    timing: "Page says no funds remain under the 2024 NOFA.",
    url: "https://ochft.org/programs",
  },
];
