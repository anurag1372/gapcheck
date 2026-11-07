import { computeGap, stressTests, usd } from "../lib/engine.mjs";
import { SYNTHETIC_DEAL } from "../data/deal.mjs";
import { RATE, STATUTE } from "../data/sources.mjs";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is missing. Add it to .env.local, then run: npm run bot");
  process.exit(1);
}
const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

let currentRate = RATE.history[RATE.history.length - 1].rate;

function gapText(rate) {
  const g = computeGap(SYNTHETIC_DEAL, rate);
  const st = stressTests(SYNTHETIC_DEAL, rate);
  return [
    `${SYNTHETIC_DEAL.name}`,
    `${STATUTE.categories[SYNTHETIC_DEAL.category].label}, household of ${g.family.cap.householdSize}`,
    `Rate: ${rate}% (${RATE.series})`,
    `Max housing cost: ${usd(g.family.cap.monthly)}/month (${g.family.cap.cite})`,
    `Family can pay: ${usd(g.familyPrice)}`,
    `Cost to create: ${usd(g.totalCost)}`,
    `Gap per home: ${usd(g.gap)}`,
    `If unconfirmed money fails: ${usd(g.gapIfUnconfirmedFails)}`,
    `Each +0.25% adds about ${usd(st.perQuarterPoint)}`,
    `Synthetic deal: dollar lines are assumptions. Not financial advice.`,
  ].join("\n");
}

async function handle(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  if (text.startsWith("/start")) {
    return api("sendMessage", {
      chat_id: chatId,
      text: `Gap Check is connected.\nYour chat ID is ${chatId}\nPut it in .env.local as TELEGRAM_CHAT_ID so the web app can send you alerts.\n\nTry /gap or /whatif 7.5`,
    });
  }
  if (text.startsWith("/gap")) return api("sendMessage", { chat_id: chatId, text: gapText(currentRate) });
  if (text.startsWith("/whatif")) {
    const rate = parseFloat(text.split(/\s+/)[1]);
    if (Number.isNaN(rate)) return api("sendMessage", { chat_id: chatId, text: "Usage: /whatif 7.5" });
    const base = computeGap(SYNTHETIC_DEAL, currentRate).gap;
    const next = computeGap(SYNTHETIC_DEAL, rate).gap;
    return api("sendMessage", {
      chat_id: chatId,
      text: `${gapText(rate)}\n\nCompared with ${currentRate}%: gap ${next >= base ? "+" : "-"}${usd(Math.abs(next - base))}`,
    });
  }
  return api("sendMessage", { chat_id: chatId, text: "Commands: /gap, /whatif 7.5" });
}

let offset = 0;
console.log("Gap Check bot is running. Open your bot in Telegram and send /start. Ctrl+C to stop.");
while (true) {
  try {
    const res = await api("getUpdates", { offset, timeout: 30 });
    for (const u of res.result || []) {
      offset = u.update_id + 1;
      if (u.message) await handle(u.message);
    }
  } catch (err) {
    console.error("Polling error:", err.message);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
