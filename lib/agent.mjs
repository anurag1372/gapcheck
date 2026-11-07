import Anthropic from "@anthropic-ai/sdk";
import { computeGap, stressTests, affordablePrice, usd } from "./engine.mjs";
import { PROGRAMS, STATUTE, INCOME_LIMITS, RATE } from "../data/sources.mjs";
import { REVIEWER_RULES, reviewDeal } from "../data/reviewerRules.mjs";

const TOOLS = [
  {
    name: "compute_gap",
    description: "Compute the deal's affordable family price, total cost, and funding gap. Optionally override the rate, bedrooms or income category.",
    input_schema: {
      type: "object",
      properties: {
        rate_pct: { type: "number" },
        bedrooms: { type: "integer" },
        category: { type: "string", enum: Object.keys(STATUTE.categories) },
      },
    },
  },
  {
    name: "reviewer_rules",
    description: "Real reviewer rules and feedback from finance professionals who reviewed an affordable housing funding application (Bank of America Affordable Housing Challenge 2026), each with its source.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "review_current_deal",
    description: "Run the reviewer rules against the current deal and return the specific issues a reviewer would flag, with severity.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_programs",
    description: "List funding programs with terms, status (open, lottery, competitive, unconfirmed, closed), timing and source URL.",
    input_schema: { type: "object", properties: {} },
  },
];

function runTool(name, input, ctx) {
  if (name === "compute_gap") {
    const deal = { ...ctx.deal, ...(input.bedrooms != null && { bedrooms: input.bedrooms }), ...(input.category && { category: input.category }) };
    const rate = input.rate_pct ?? ctx.ratePct;
    const g = computeGap(deal, rate, ctx.assumptions);
    const st = stressTests(deal, rate, ctx.assumptions);
    return {
      rate_pct: rate,
      household_size: g.family.cap.householdSize,
      category: STATUTE.categories[deal.category].label,
      max_monthly_housing_cost: usd(g.family.cap.monthly),
      formula: `${g.family.cap.formula} (${g.family.cap.cite})`,
      affordable_family_price: usd(g.familyPrice),
      total_cost: usd(g.totalCost),
      other_sources: usd(g.sourcesTotal),
      gap: usd(g.gap),
      gap_if_unconfirmed_fails: usd(g.gapIfUnconfirmedFails),
      gap_change_per_quarter_point: usd(st.perQuarterPoint),
      assumptions: g.family.assumptions,
    };
  }
  if (name === "list_programs") return PROGRAMS;
  if (name === "reviewer_rules") return REVIEWER_RULES;
  if (name === "review_current_deal") return reviewDeal(ctx.deal, computeGap(ctx.deal, ctx.ratePct, ctx.assumptions));
  return { error: "unknown tool" };
}

export async function runAgent({ messages, deal, ratePct, assumptions, persona = "Finance lead", context }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set in .env.local");
  if (!process.env.ANTHROPIC_MODEL) throw new Error("ANTHROPIC_MODEL is not set in .env.local");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const system =
    `You are Gap Check, helping a ${persona} at an Orange County housing nonprofit understand an affordable-ownership deal. ` +
    `Never calculate or invent numbers yourself: call compute_gap or list_programs and quote their results. ` +
    `For questions about reviewers, rejections, red flags or application readiness, call reviewer_rules and review_current_deal. ` +
    `Lead with what reviewers actually flagged (say it comes from real Bank of America challenge reviewers, on an LA County rental deal), then the specific issues in this deal. Do not pad with generic advice. ` +
    `Facts: ${STATUTE.name}; income limits from ${INCOME_LIMITS.table}; rate from ${RATE.series}. ` +
    `The deal is SYNTHETIC and its dollar lines are assumptions; say so when relevant. ` +
    `Mark program money as unconfirmed unless its status is open. ` +
    `FORMAT, strictly: Line 1 is the direct answer in one sentence, with the key number. ` +
    `Then 2 to 4 lines starting with "- ", each one fact written as "Label: value" (e.g. "- Gap per home: $79,798"). ` +
    `Last line starts with "Next: " and gives one concrete action the user can take in the app. ` +
    `Under 70 words. No preamble, no restating the question, no markdown symbols (no **, #, tables). ` +
    `Do not add disclaimers about synthetic data or advice; the app shows those.` +
    (context ? ` What the user entered on screen (already computed by the engine, safe to quote): ${JSON.stringify(context)}` : "");
  const ctx = { deal, ratePct, assumptions };
  const used = new Set();
  const convo = messages.map((m) => ({ role: m.role, content: m.content }));

  for (let step = 0; step < 5; step++) {
    const res = await client.messages.create({ model: process.env.ANTHROPIC_MODEL, max_tokens: 4000, system, tools: TOOLS, messages: convo });
    if (res.stop_reason !== "tool_use") {
      const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
      return { text: text || `No answer came back (stop reason: ${res.stop_reason}). Try asking a shorter question.`, tools: [...used] };
    }
    convo.push({ role: "assistant", content: res.content });
    const results = res.content
      .filter((b) => b.type === "tool_use")
      .map((b) => (used.add(b.name), { type: "tool_result", tool_use_id: b.id, content: JSON.stringify(runTool(b.name, b.input, ctx)) }));
    convo.push({ role: "user", content: results });
  }
  return { text: "Stopped after too many tool calls.", tools: [...used] };
}
