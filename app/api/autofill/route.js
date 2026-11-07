import { extractJson } from "@/lib/review.mjs";

export const maxDuration = 120;

const PROMPTS = {
  finance: `Read this affordable housing deal document and extract only values that are explicitly stated.
Return ONLY JSON, no prose. Omit any field you cannot find. For each found field give {"value": number, "quote": "exact text"}.
{
  "bedrooms": {...}, "land": {...}, "time_costs": {...}, "construction": {...}, "fees": {...},
  "utilities": {...}, "sitework": {...}, "public_subsidy": {...}, "rent_income": {...},
  "down_payment_pct": {...}, "property_tax_pct": {...}, "insurance_monthly": {...}, "hoa_monthly": {...}
}`,
  family: `Read this household document (pay stub, tax return, offer letter, or application) and extract only values that are explicitly stated.
Return ONLY JSON, no prose. Omit any field you cannot find. Give {"value": ..., "quote": "exact text"} for each.
{ "household_size": {...number}, "annual_income": {...number, annualize pay stubs and say how in the quote}, "city": {...string, an Orange County city} }`,
};

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const mode = form.get("mode");
    if (!file || !PROMPTS[mode]) return Response.json({ error: "Upload a file" }, { status: 400 });
    return Response.json({ fields: await extractJson(file, PROMPTS[mode]) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
