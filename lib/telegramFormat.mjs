import { computeGap, stressTests, whoClosesTheGap, usd } from "./engine.mjs";
import { STATUTE, RATE } from "../data/sources.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const signed = (n) => (n >= 0 ? `+${usd(n)}` : `−${usd(-n)}`);

export function rateAlertHTML({ deal, oldRate, newRate, rateDate, assumptions, simulated = false }) {
  const before = computeGap(deal, oldRate, assumptions);
  const after = computeGap(deal, newRate, assumptions);
  const v = whoClosesTheGap(deal, after);
  const up = newRate > oldRate;
  const lines = [
    `${up ? "▲" : "▼"} <b>Gap Check · Rate alert</b>${simulated ? " <i>(simulated)</i>" : ""}`,
    ``,
    `<b>Freddie Mac 30-yr fixed</b>`,
    `${oldRate.toFixed(2)}% → <b>${newRate.toFixed(2)}%</b>${rateDate ? `  <i>(${esc(rateDate)})</i>` : ""}`,
    ``,
    `<b>${esc(deal.name)}</b>`,
    `<code>Family can pay  ${usd(before.familyPrice).padStart(9)} → ${usd(after.familyPrice)}</code>`,
    `<code>Gap per home    ${usd(before.gap).padStart(9)} → ${usd(after.gap)}</code>`,
    `<code>Change          ${signed(after.gap - before.gap).padStart(9)}</code>`,
    ``,
    after.gap > 0 ? `✗ <b>Does not pencil.</b> Short ${usd(after.gap)}.` : `✓ <b>Pencils.</b>`,
  ];
  if (after.gap > 0 && v.closers.length) {
    lines.push(``, `<b>Who closes it</b>`);
    v.closers.forEach((c, i) => lines.push(`${i + 1}. ${esc(c.name)} · ${usd(c.amount)} <i>(${esc(c.certainty)})</i>`));
  }
  lines.push(``, `<i>Synthetic deal; dollar lines are assumptions. Not financial advice.</i>`);
  return lines.join("\n");
}

export function rateCaptionHTML({ deal, oldRate, newRate, assumptions, simulated = false }) {
  const before = computeGap(deal, oldRate, assumptions);
  const after = computeGap(deal, newRate, assumptions);
  const d = after.gap - before.gap;
  return [
    `<b>Rates moved ${oldRate.toFixed(2)}% → ${newRate.toFixed(2)}%.</b>${simulated ? " <i>(simulated)</i>" : ""}`,
    `Your gap ${d >= 0 ? "grew" : "shrank"} <b>${usd(Math.abs(d))}</b> to <b>${usd(Math.max(after.gap, 0))}</b> per home.`,
    after.gap > 0 ? `Open the app to pick a move that makes it pencil.` : `It pencils. Nothing to do.`,
  ].join("\n");
}

export function reviewHTML({ fileName, flags }) {
  const high = flags.filter((f) => f.severity === "high").length;
  const lines = [
    `<b>Gap Check · Review finished</b>`,
    `<i>${esc(fileName)}</i>`,
    ``,
    flags.length ? `<b>${flags.length} issue${flags.length === 1 ? "" : "s"}</b> to fix before you submit (${high} high)` : `<b>No issues found.</b> Ready to submit.`,
  ];
  flags.slice(0, 6).forEach((f, i) => lines.push(`${i + 1}. ${f.severity === "high" ? "<b>[HIGH]</b> " : ""}${esc(f.title)}`));
  if (flags.length > 6) lines.push(`…and ${flags.length - 6} more in the app.`);
  lines.push(``, `<i>Rules from Bank of America Affordable Housing Challenge 2026 reviewers.</i>`);
  return lines.join("\n");
}

export function gapHTML({ deal, rate, assumptions }) {
  const g = computeGap(deal, rate, assumptions);
  const st = stressTests(deal, rate, assumptions);
  const v = whoClosesTheGap(deal, g);
  const lines = [
    `<b>Gap Check · Deal snapshot</b>`,
    ``,
    `<b>${esc(deal.name)}</b>`,
    `${esc(STATUTE.categories[deal.category].label)} · household of ${g.family.cap.householdSize}`,
    `Rate ${rate.toFixed(2)}% <i>(${esc(RATE.series)})</i>`,
    ``,
    `<code>Max housing cost ${usd(g.family.cap.monthly).padStart(9)}/mo</code>`,
    `<code>Family can pay   ${usd(g.familyPrice).padStart(9)}</code>`,
    `<code>Cost to create   ${usd(g.totalCost).padStart(9)}</code>`,
    `<code>Gap per home     ${usd(g.gap).padStart(9)}</code>`,
    `<code>If unconfirmed   ${usd(g.gapIfUnconfirmedFails).padStart(9)}</code>`,
    `<code>Per +0.25% rate  ${signed(st.perQuarterPoint).padStart(9)}</code>`,
    ``,
    g.gap > 0 ? `✗ <b>Does not pencil.</b>` : `✓ <b>Pencils.</b>`,
  ];
  if (g.gap > 0) {
    lines.push(``, `<b>Who closes it</b>`);
    v.closers.forEach((c, i) => lines.push(`${i + 1}. ${esc(c.name)} · ${usd(c.amount)} <i>(${esc(c.certainty)})</i>`));
  }
  lines.push(``, `<i>Cap: ${esc(g.family.cap.formula)} (${esc(g.family.cap.cite)})</i>`);
  return lines.join("\n");
}
