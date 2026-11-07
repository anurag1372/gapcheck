import { computeGap, stressTests } from "./engine.mjs";
import { INCOME_LIMITS, STATUTE, RATE, MARKET, PROGRAMS } from "../data/sources.mjs";

const C = {
  brand: "FF059669",
  brandDark: "FF065F46",
  brandLight: "FFECFDF5",
  ink: "FF0F172A",
  muted: "FF64748B",
  line: "FFE2E8F0",
  panel: "FFF8FAFC",
  input: "FFFEF9C3",
  red: "FFDC2626",
  amber: "FFB45309",
  link: "FF0369A1",
  white: "FFFFFFFF",
};
const USD = '"$"#,##0';
const PCT = "0.00%";
const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const thin = { style: "thin", color: { argb: C.line } };
const box = { top: thin, left: thin, bottom: thin, right: thin };

function banner(ws, title, subtitle, cols) {
  ws.mergeCells(1, 1, 1, cols);
  ws.mergeCells(2, 1, 2, cols);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { name: "Calibri", size: 20, bold: true, color: { argb: C.white } };
  t.fill = fill(C.brand);
  t.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 36;
  const s = ws.getCell(2, 1);
  s.value = subtitle;
  s.font = { size: 11, italic: true, color: { argb: C.white } };
  s.fill = fill(C.brandDark);
  s.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(2).height = 22;
}

function section(ws, row, text, cols) {
  ws.mergeCells(row, 1, row, cols);
  const c = ws.getCell(row, 1);
  c.value = text.toUpperCase();
  c.font = { bold: true, size: 11, color: { argb: C.brandDark } };
  c.border = { bottom: { style: "medium", color: { argb: C.brand } } };
  ws.getRow(row).height = 22;
}

function link(cell, text, url) {
  cell.value = { text, hyperlink: url };
  cell.font = { color: { argb: C.link }, underline: true };
}

export async function buildProformaWorkbook({ deal, ratePct, assumptions, rateDate, preparedFor }) {
  const ExcelJS = (await import("exceljs")).default;
  const g = computeGap(deal, ratePct, assumptions);
  const st = stressTests(deal, ratePct, assumptions);
  const a = g.family.assumptions;
  const cat = STATUTE.categories[deal.category];
  const today = new Date().toISOString().slice(0, 10);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Gap Check";
  wb.created = new Date();

  const ov = wb.addWorksheet("Overview", { views: [{ showGridLines: false }], properties: { tabColor: { argb: C.brand } } });
  const pf = wb.addWorksheet("Pro forma", { views: [{ showGridLines: false }], properties: { tabColor: { argb: C.ink } } });
  const src = wb.addWorksheet("Sources & assumptions", { views: [{ showGridLines: false }], properties: { tabColor: { argb: C.amber } } });

  // ---------- Pro forma (built first so Overview can reference its cells) ----------
  pf.columns = [{ width: 46 }, { width: 18 }, { width: 16 }, { width: 50 }];
  banner(pf, "Pro forma", `${deal.name} · generated ${today}`, 4);
  pf.getCell("A3").value = "Yellow cells are inputs. Change them and every total recalculates.";
  pf.getCell("A3").font = { italic: true, size: 10, color: { argb: C.muted } };

  let r = 5;
  section(pf, r++, "Inputs", 4);
  const inputs = {};
  const addInput = (key, label, value, fmt, note) => {
    pf.getCell(r, 1).value = label;
    const v = pf.getCell(r, 2);
    v.value = value;
    if (fmt) v.numFmt = fmt;
    v.fill = fill(C.input);
    v.border = box;
    v.alignment = { horizontal: "right" };
    pf.getCell(r, 4).value = note;
    pf.getCell(r, 4).font = { size: 10, color: { argb: C.muted } };
    inputs[key] = `B${r}`;
    r++;
  };
  addInput("size", "Household size (bedrooms + 1)", g.family.cap.householdSize, "0", STATUTE.familySizeRule);
  addInput("ami", `Area median income, household of ${g.family.cap.householdSize}`, g.family.cap.amiAdjusted, USD, INCOME_LIMITS.table);
  addInput("incShare", "Share of income for housing", cat.incomeShare, "0%", `HSC 50052.5${cat.cite}, ${cat.label}`);
  addInput("amiShare", "Share of area median", cat.amiShare, "0%", `HSC 50052.5${cat.cite}`);
  addInput("rate", "30-year mortgage rate", ratePct / 100, PCT, `${RATE.series}, ${rateDate}`);
  addInput("term", "Loan term (years)", a.termYears, "0", "ASSUMPTION");
  addInput("down", "Down payment", a.downPaymentPct / 100, "0.0%", "ASSUMPTION");
  addInput("tax", "Property tax rate", a.propertyTaxPct / 100, "0.00%", "ASSUMPTION");
  addInput("ins", "Insurance per month", a.insuranceMonthly, USD, "ASSUMPTION");
  addInput("hoa", "HOA per month", a.hoaMonthly, USD, "ASSUMPTION");

  r++;
  section(pf, r++, "What the family can pay", 4);
  const capRow = r;
  pf.getCell(r, 1).value = "Max monthly housing cost";
  pf.getCell(r, 2).value = { formula: `${inputs.incShare}*${inputs.amiShare}*${inputs.ami}/12`, result: g.family.cap.monthly };
  pf.getCell(r, 2).numFmt = USD;
  pf.getCell(r, 4).value = "Income share × median share × area median ÷ 12";
  pf.getCell(r, 4).font = { size: 10, color: { argb: C.muted } };
  r++;
  const priceRow = r;
  pf.getCell(r, 1).value = "Affordable family price";
  pf.getCell(r, 1).font = { bold: true };
  pf.getCell(r, 2).value = {
    formula: `MAX(0,(B${capRow}-${inputs.ins}-${inputs.hoa})/((1-${inputs.down})*(-PMT(${inputs.rate}/12,${inputs.term}*12,1))+${inputs.tax}/12))`,
    result: g.familyPrice,
  };
  pf.getCell(r, 2).numFmt = USD;
  pf.getCell(r, 2).font = { bold: true, color: { argb: C.brand } };
  pf.getCell(r, 4).value = "Price whose mortgage, tax and insurance fit the cap";
  pf.getCell(r, 4).font = { size: 10, color: { argb: C.muted } };
  r += 2;

  section(pf, r++, "Uses: cost to create", 4);
  ["Line item", "Amount", "", "Basis"].forEach((h, i) => {
    const c = pf.getCell(r, i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: C.white } };
    c.fill = fill(C.ink);
  });
  r++;
  const usesStart = r;
  deal.costs.forEach((c, i) => {
    pf.getCell(r, 1).value = c.label;
    pf.getCell(r, 2).value = Number(c.amount);
    pf.getCell(r, 2).numFmt = USD;
    pf.getCell(r, 2).fill = fill(C.input);
    pf.getCell(r, 4).value = c.basis;
    pf.getCell(r, 4).font = { size: 10, color: { argb: C.muted } };
    if (i % 2) [1, 3, 4].forEach((k) => (pf.getCell(r, k).fill = fill(C.panel)));
    r++;
  });
  const usesTotalRow = r;
  pf.getCell(r, 1).value = "Total cost to create";
  pf.getCell(r, 2).value = { formula: `SUM(B${usesStart}:B${r - 1})`, result: g.totalCost };
  [1, 2].forEach((k) => {
    pf.getCell(r, k).font = { bold: true };
    pf.getCell(r, k).border = { top: { style: "thin", color: { argb: C.ink } } };
  });
  pf.getCell(r, 2).numFmt = USD;
  r += 2;

  section(pf, r++, "Sources: who pays", 4);
  ["Source", "Amount", "Status", "Paid during"].forEach((h, i) => {
    const c = pf.getCell(r, i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: C.white } };
    c.fill = fill(C.ink);
  });
  r++;
  const srcStart = r;
  pf.getCell(r, 1).value = "Family price (mortgage + down payment)";
  pf.getCell(r, 2).value = { formula: `B${priceRow}`, result: g.familyPrice };
  pf.getCell(r, 2).numFmt = USD;
  pf.getCell(r, 3).value = "derived";
  pf.getCell(r, 4).value = "at sale";
  r++;
  deal.sources.forEach((s) => {
    pf.getCell(r, 1).value = s.label;
    pf.getCell(r, 2).value = Number(s.amount);
    pf.getCell(r, 2).numFmt = USD;
    pf.getCell(r, 2).fill = fill(C.input);
    const st = pf.getCell(r, 3);
    st.value = s.status;
    st.font = { bold: true, color: { argb: s.status === "confirmed" ? C.brand : C.amber } };
    pf.getCell(r, 4).value = s.phase;
    r++;
  });
  const srcEnd = r - 1;
  const srcTotalRow = r;
  pf.getCell(r, 1).value = "Total sources";
  pf.getCell(r, 2).value = { formula: `SUM(B${srcStart}:B${srcEnd})`, result: g.familyPrice + g.sourcesTotal };
  pf.getCell(r, 2).numFmt = USD;
  [1, 2].forEach((k) => {
    pf.getCell(r, k).font = { bold: true };
    pf.getCell(r, k).border = { top: { style: "thin", color: { argb: C.ink } } };
  });
  r += 2;

  section(pf, r++, "Result", 4);
  const gapRow = r;
  const result = (label, formula, value, color, note) => {
    pf.getCell(r, 1).value = label;
    pf.getCell(r, 1).font = { bold: true, size: 12 };
    const c = pf.getCell(r, 2);
    c.value = formula ? { formula, result: value } : value;
    c.numFmt = USD;
    c.font = { bold: true, size: 12, color: { argb: color } };
    pf.getCell(r, 4).value = note;
    pf.getCell(r, 4).font = { size: 10, color: { argb: C.muted } };
    r++;
  };
  result("Gap per home", `B${usesTotalRow}-B${srcTotalRow}`, g.gap, C.red, "Cost to create minus everything that pays for it");
  const worstRow = r;
  result(
    "Gap if unconfirmed money falls through",
    `B${gapRow}+SUMIFS(B${srcStart}:B${srcEnd},C${srcStart}:C${srcEnd},"unconfirmed")+SUMIFS(B${srcStart}:B${srcEnd},C${srcStart}:C${srcEnd},"competitive")`,
    g.gapIfUnconfirmedFails,
    C.amber,
    "Adds back every source not marked confirmed"
  );
  result("Gap change per +0.25% rate", null, st.perQuarterPoint, C.ink, `Calculated by Gap Check at ${ratePct}%`);
  result("Cost of one month of delay", null, st.perMonthDelay, C.ink, "ASSUMPTION from the synthetic deal");

  // ---------- Overview ----------
  ov.columns = [{ width: 4 }, { width: 44 }, { width: 22 }, { width: 62 }];
  banner(ov, "Gap Check · Pro forma", `Prepared for ${preparedFor} · ${today}`, 4);
  ov.mergeCells("B4:D4");
  ov.getCell("B4").value = deal.name;
  ov.getCell("B4").font = { bold: true, size: 14, color: { argb: C.ink } };
  ov.mergeCells("B5:D5");
  ov.getCell("B5").value = deal.note;
  ov.getCell("B5").font = { italic: true, size: 10, color: { argb: C.amber } };

  let o = 7;
  const ovSection = (text) => {
    ov.mergeCells(o, 2, o, 4);
    const c = ov.getCell(o, 2);
    c.value = text.toUpperCase();
    c.font = { bold: true, color: { argb: C.brandDark } };
    c.border = { bottom: { style: "medium", color: { argb: C.brand } } };
    ov.getRow(o).height = 22;
    o++;
  };

  ovSection("Key results");
  const kpi = (label, ref, value, color) => {
    ov.getCell(o, 2).value = label;
    ov.getCell(o, 2).font = { color: { argb: C.muted } };
    const c = ov.getCell(o, 3);
    c.value = { formula: `'Pro forma'!${ref}`, result: value };
    c.numFmt = USD;
    c.font = { bold: true, size: 14, color: { argb: color } };
    c.alignment = { horizontal: "right" };
    [2, 3].forEach((k) => (ov.getCell(o, k).fill = fill(C.panel)));
    ov.getRow(o).height = 24;
    o++;
  };
  kpi("Cost to create one home", `B${usesTotalRow}`, g.totalCost, C.ink);
  kpi("What the family can pay", `B${priceRow}`, g.familyPrice, C.brand);
  kpi("Gap per home", `B${gapRow}`, g.gap, C.red);
  kpi("Gap if unconfirmed money falls through", `B${worstRow}`, g.gapIfUnconfirmedFails, C.amber);
  o++;

  ovSection("What we pulled in for you");
  const pulled = [
    ["Your project budget", "Every cost line you entered in your Gap Check workspace"],
    ["Your funding plan", "Each source, its amount, whether it is confirmed, and when it pays"],
    ["The buyer household", "Home size and the income category you are serving"],
    ["Today's mortgage market", "The latest weekly 30-year rate from Freddie Mac"],
    ["Official income limits", "California's 2026 Orange County income table"],
    ["State affordability law", "The legal cap on what a family can be charged"],
    ["Your loan assumptions", "Down payment, tax, insurance and HOA, all editable"],
  ];
  pulled.forEach(([k, v]) => {
    ov.getCell(o, 2).value = `✓  ${k}`;
    ov.getCell(o, 2).font = { bold: true, color: { argb: C.ink } };
    ov.mergeCells(o, 3, o, 4);
    ov.getCell(o, 3).value = v;
    ov.getCell(o, 3).font = { color: { argb: C.muted } };
    o++;
  });
  o++;

  ovSection("Why this helps you");
  [
    "No re-typing. Everything you set up on the website flows straight into this file.",
    "Every number is traceable: sourced with a link, or clearly labeled ASSUMPTION.",
    "Live formulas. Change a yellow cell on the Pro forma tab and every total updates.",
    "Funder-ready. Reviewers see the cap, the rate and the risk in one place.",
  ].forEach((t) => {
    ov.mergeCells(o, 2, o, 4);
    ov.getCell(o, 2).value = `•  ${t}`;
    ov.getCell(o, 2).alignment = { wrapText: true, vertical: "top" };
    o++;
  });
  o++;

  ovSection("Where to use this pro forma");
  PROGRAMS.filter((p) => p.status !== "closed").forEach((p) => {
    link(ov.getCell(o, 2), p.name, p.url);
    ov.getCell(o, 3).value = p.status;
    ov.getCell(o, 3).font = { bold: true, color: { argb: p.status === "open" ? C.brand : C.amber } };
    ov.getCell(o, 4).value = p.timing;
    ov.getCell(o, 4).font = { size: 10, color: { argb: C.muted } };
    ov.getCell(o, 4).alignment = { wrapText: true };
    o++;
  });
  o++;

  ovSection("Sources");
  [
    [INCOME_LIMITS.table, INCOME_LIMITS.url],
    [STATUTE.name, STATUTE.url],
    [RATE.series, RATE.url],
    [MARKET.label, MARKET.url],
  ].forEach(([t, u]) => {
    ov.mergeCells(o, 2, o, 4);
    link(ov.getCell(o, 2), t, u);
    o++;
  });
  o++;
  ov.mergeCells(o, 2, o, 4);
  ov.getCell(o, 2).value = "Prototype. Not legal, financial, lending or tax advice.";
  ov.getCell(o, 2).font = { italic: true, size: 9, color: { argb: C.muted } };

  // ---------- Sources & assumptions ----------
  src.columns = [{ width: 38 }, { width: 22 }, { width: 70 }, { width: 14 }];
  banner(src, "Sources & assumptions", "Every number in this file, where it came from, and when we checked", 4);
  let s = 4;
  ["Item", "Value", "Source", "Checked"].forEach((h, i) => {
    const c = src.getCell(s, i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: C.white } };
    c.fill = fill(C.ink);
  });
  s++;
  const rows = [
    ["Area median income (household of 4)", INCOME_LIMITS.ami, USD, [INCOME_LIMITS.table, INCOME_LIMITS.url], INCOME_LIMITS.checked],
    ["Affordable cost cap", `${cat.incomeShare * 100}% × ${cat.amiShare * 100}% of median`, null, [STATUTE.name, STATUTE.url], STATUTE.checked],
    ["Household size rule", "bedrooms + 1", null, [STATUTE.familySizeRule, STATUTE.url], STATUTE.checked],
    ["30-year mortgage rate", ratePct / 100, PCT, [RATE.series, RATE.url], rateDate],
    ["OC median home price", MARKET.medianPrice, USD, [MARKET.label, MARKET.url], MARKET.checked],
    ["Loan term (years)", a.termYears, "0", ["ASSUMPTION"], ""],
    ["Down payment", a.downPaymentPct / 100, "0.0%", ["ASSUMPTION"], ""],
    ["Property tax rate", a.propertyTaxPct / 100, "0.00%", ["ASSUMPTION (about 1% plus local assessments)"], ""],
    ["Insurance per month", a.insuranceMonthly, USD, ["ASSUMPTION (no Orange County source)"], ""],
    ["HOA per month", a.hoaMonthly, USD, ["ASSUMPTION"], ""],
    ["Deal costs and other sources", "see Pro forma", null, ["SYNTHETIC deal from the organizers. Every dollar is an ASSUMPTION"], ""],
  ];
  rows.forEach(([item, val, fmt, [text, url], checked], i) => {
    src.getCell(s, 1).value = item;
    const v = src.getCell(s, 2);
    v.value = val;
    if (fmt) v.numFmt = fmt;
    if (url) link(src.getCell(s, 3), text, url);
    else {
      src.getCell(s, 3).value = text;
      src.getCell(s, 3).font = { color: { argb: C.amber } };
    }
    src.getCell(s, 4).value = checked;
    if (i % 2) [1, 2, 3, 4].forEach((k) => (src.getCell(s, k).fill = fill(C.panel)));
    s++;
  });

  return wb;
}

export async function downloadProforma(opts) {
  const wb = await buildProformaWorkbook(opts);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = `gapcheck-proforma-${new Date().toISOString().slice(0, 10)}.xlsx`;
  el.click();
  URL.revokeObjectURL(url);
}
