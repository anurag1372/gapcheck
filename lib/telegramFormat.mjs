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
