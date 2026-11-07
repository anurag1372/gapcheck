import Anthropic from "@anthropic-ai/sdk";
import * as XLSX from "xlsx";

const EXTRACT_PROMPT = `You are extracting numbers from an affordable housing funding application so deterministic rules can check it.
Return ONLY a JSON object, no prose, with this shape (use null when not found; quote the exact text and where it appears):
{
  "tenure": "rental" | "ownership" | null,
  "unit_counts": [{"value": number, "quote": string, "where": string}],
  "total_development_cost": [{"value": number, "quote": string, "where": string}],
  "total_sources": [{"value": number, "quote": string, "where": string}],
  "hard_costs": number | null,
  "soft_costs": number | null,
  "hard_cost_contingency_pct": number | null,
  "demolition_amount": number | null,
  "mentions_remediation": boolean,
  "mentions_utility_connections": boolean,
  "uses_lihtc": boolean,
  "dscr": [{"value": number, "quote": string, "where": string}],
  "construction_phase_sources": [{"name": string, "amount": number, "quote": string}],
  "income_limits_date_cited": string | null
}`;

function check(x) {
  const flags = [];
  const add = (severity, title, detail) => flags.push({ severity, title, detail });
  const distinct = (arr) => [...new Set((arr || []).map((a) => a.value))];

  if (distinct(x.unit_counts).length > 1)
    add("high", "Unit count differs across the document", x.unit_counts.map((u) => `${u.value} (${u.where}: "${u.quote}")`).join("; "));
  if (distinct(x.total_development_cost).length > 1)
    add("high", "Total development cost differs across the document", x.total_development_cost.map((u) => `$${u.value.toLocaleString()} (${u.where})`).join("; "));
  if (distinct(x.dscr).length > 1)
    add("medium", "Debt coverage ratio differs across the document", x.dscr.map((u) => `${u.value}x (${u.where})`).join("; "));
  const tdc = x.total_development_cost?.[0]?.value;
  const src = x.total_sources?.[0]?.value;
  if (tdc && src && Math.abs(tdc - src) > 1) add("high", "Sources do not equal uses", `Uses $${tdc.toLocaleString()} vs sources $${src.toLocaleString()}`);
  if (x.hard_cost_contingency_pct != null && x.hard_cost_contingency_pct < 5)
    add("high", "Hard cost contingency below 5%", `${x.hard_cost_contingency_pct}% found; new construction needs at least 5% (10% rehab)`);
  if (tdc && x.soft_costs != null) {
    const pct = (x.soft_costs / tdc) * 100;
    if (pct < 5) add("medium", "Soft costs look low", `${pct.toFixed(1)}% of total; reviewers expect roughly 5–10%`);
  }
  if (x.demolition_amount && !x.mentions_remediation)
    add("medium", "Demolition with no asbestos or lead remediation", `Demolition $${x.demolition_amount.toLocaleString()} budgeted; no remediation line found`);
  if (!x.mentions_utility_connections) add("low", "No utility connection line found", "SCE, water and sewer hookups are often missed");
  if (x.uses_lihtc && x.tenure === "ownership") add("high", "LIHTC in an ownership deal", "LIHTC is rental only");
  for (const s of x.construction_phase_sources || []) {
    if (/LACDA|county|residual/i.test(s.name))
      add("medium", "County money counted during construction", `${s.name}: "${s.quote}". Reviewers noted county loans usually fund at permanent, not construction`);
  }
  return flags;
}

export async function extractJson(file, prompt) {
  if (!process.env.ANTHROPIC_API_KEY || !process.env.ANTHROPIC_MODEL) throw new Error("Set ANTHROPIC_API_KEY and ANTHROPIC_MODEL in .env.local");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let content;
  if (name.endsWith(".pdf")) {
    content = [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") } },
      { type: "text", text: prompt },
    ];
  } else if (/\.(png|jpe?g|webp)$/.test(name)) {
    const media = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
    content = [
      { type: "image", source: { type: "base64", media_type: media, data: buf.toString("base64") } },
      { type: "text", text: prompt },
    ];
  } else {
    let text;
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const wb = XLSX.read(buf);
      text = wb.SheetNames.map((s) => `### Sheet: ${s}\n${XLSX.utils.sheet_to_csv(wb.Sheets[s])}`).join("\n\n");
    } else text = buf.toString("utf-8");
    content = [{ type: "text", text: `${prompt}\n\nDOCUMENT (${file.name}):\n${text.slice(0, 150000)}` }];
  }
  const res = await client.messages.create({ model: process.env.ANTHROPIC_MODEL, max_tokens: 16000, messages: [{ role: "user", content }] });
  const raw = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
}

export async function reviewFile(file) {
  const json = await extractJson(file, EXTRACT_PROMPT);
  return { extracted: json, flags: check(json) };
}
