import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { SYNTHETIC_DEAL } from "../data/deal.mjs";
import { RATE } from "../data/sources.mjs";
import { sendTelegram, sendTelegramPhoto, fetchLatestRate } from "../lib/telegram.mjs";
import { rateAlertHTML, rateCaptionHTML, gapHTML } from "../lib/telegramFormat.mjs";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is missing. Add it to .env.local, then run: npm run bot");
  process.exit(1);
}
const ALERT_CHAT = process.env.TELEGRAM_CHAT_ID;
const INTERVAL_MIN = Number(process.env.WATCH_INTERVAL_MIN || 60);
const STATE_FILE = new URL("../.watch-state.json", import.meta.url);

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function sendRateAlert({ oldRate, newRate, rateDate, simulated, chatId }) {
  try {
    const q = new URLSearchParams({ old: oldRate, new: newRate, date: rateDate || "", title: simulated ? "Rate alert (simulated)" : "Rate alert" });
    const res = await fetch(`${APP_URL}/api/alert-card?${q}`);
    if (!res.ok) throw new Error(`card ${res.status}`);
    const png = Buffer.from(await res.arrayBuffer());
    const sent = await sendTelegramPhoto(png, rateCaptionHTML({ deal: SYNTHETIC_DEAL, oldRate, newRate, simulated }), chatId);
    if (sent.ok) return sent;
    throw new Error(sent.error);
  } catch (err) {
    console.log("[alert] image card unavailable, sending text:", err.message);
    return sendTelegram(rateAlertHTML({ deal: SYNTHETIC_DEAL, oldRate, newRate, rateDate, simulated }), chatId);
  }
}

const loadState = () => (existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : null);
const saveState = (s) => writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
let state = loadState() || { rate: RATE.history[RATE.history.length - 1].rate, date: RATE.history[RATE.history.length - 1].date, lastCheck: null };

async function checkRate({ announceNoChange = false, chatId = ALERT_CHAT } = {}) {
  const latest = await fetchLatestRate(RATE.url);
  const changed = latest.rate !== state.rate || latest.date !== state.date;
  const previous = state.rate;
  state = { rate: latest.rate, date: latest.date, lastCheck: new Date().toISOString() };
  saveState(state);
  console.log(`[watch] ${state.lastCheck} Freddie Mac ${latest.rate}% (${latest.date})${changed ? ` changed from ${previous}%` : ""}`);
  if (changed && latest.rate !== previous) {
    await sendRateAlert({ oldRate: previous, newRate: latest.rate, rateDate: latest.date, chatId });
  } else if (announceNoChange) {
    await sendTelegram(
      `<b>Gap Check · Rate check</b>\n\nFreddie Mac 30-yr fixed: <b>${latest.rate.toFixed(2)}%</b> <i>(${latest.date})</i>\nNo change since the last check. I'll message you when it moves.`,
      chatId
    );
  }
  return latest;
}

async function handle(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const [cmd, arg] = text.split(/\s+/);

  if (cmd === "/start" || cmd === "/help") {
    return sendTelegram(
      [
        `<b>Gap Check is connected.</b>`,
        `Your chat ID: <code>${chatId}</code>`,
        ``,
        `<b>What I do automatically</b>`,
        `Every ${INTERVAL_MIN} min I read Freddie Mac's weekly mortgage rate file. When the rate moves, I recompute what the family can pay under state law and send you the new gap.`,
        ``,
        `<b>Commands</b>`,
        `/gap · today's deal snapshot`,
        `/whatif 7.5 · the gap at any rate`,
        `/check · check Freddie Mac right now`,
        `/simulate 7.32 · preview the alert for a rate move`,
        `/watch · watcher status`,
      ].join("\n"),
      chatId
    );
  }
  if (cmd === "/gap") return sendTelegram(gapHTML({ deal: SYNTHETIC_DEAL, rate: state.rate }), chatId);
  if (cmd === "/whatif") {
    const rate = parseFloat(arg);
    if (Number.isNaN(rate)) return sendTelegram("Usage: <code>/whatif 7.5</code>", chatId);
    return sendTelegram(rateAlertHTML({ deal: SYNTHETIC_DEAL, oldRate: state.rate, newRate: rate, simulated: true }).replace("Rate alert", "What if"), chatId);
  }
  if (cmd === "/simulate") {
    const rate = parseFloat(arg) || Math.round((state.rate + 0.14) * 100) / 100;
    return sendRateAlert({ oldRate: state.rate, newRate: rate, rateDate: "next Thursday", simulated: true, chatId });
  }
  if (cmd === "/check") {
    try {
      await checkRate({ announceNoChange: true, chatId });
    } catch (err) {
      await sendTelegram(`Could not reach Freddie Mac: ${err.message}`, chatId);
    }
    return;
  }
  if (cmd === "/watch") {
    return sendTelegram(
      [
        `<b>Gap Check · Watcher</b>`,
        ``,
        `Source: <a href="${RATE.url}">Freddie Mac PMMS history (CSV)</a>`,
        `Checks every: <b>${INTERVAL_MIN} min</b>`,
        `Last seen: <b>${state.rate.toFixed(2)}%</b> (${state.date})`,
        `Last check: ${state.lastCheck ? new Date(state.lastCheck).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) : "not yet"}`,
        `Alerts go to: <code>${ALERT_CHAT || "not set"}</code>`,
      ].join("\n"),
      chatId
    );
  }
  return sendTelegram("Try /gap, /whatif 7.5, /check, /simulate or /watch", chatId);
}

await api("setMyCommands", {
  commands: [
    { command: "gap", description: "Today's deal snapshot" },
    { command: "whatif", description: "Gap at any rate, e.g. /whatif 7.5" },
    { command: "check", description: "Check Freddie Mac right now" },
    { command: "simulate", description: "Preview a rate-move alert" },
    { command: "watch", description: "Watcher status" },
    { command: "help", description: "What Gap Check does" },
  ],
});

console.log(`Gap Check bot running. Watching Freddie Mac every ${INTERVAL_MIN} min. Ctrl+C to stop.`);
checkRate().catch((e) => console.error("[watch]", e.message));
setInterval(() => checkRate().catch((e) => console.error("[watch]", e.message)), INTERVAL_MIN * 60 * 1000);

let offset = 0;
while (true) {
  try {
    const res = await api("getUpdates", { offset, timeout: 30 });
    for (const u of res.result || []) {
      offset = u.update_id + 1;
      if (u.message) await handle(u.message).catch((e) => console.error("handle:", e.message));
    }
  } catch (err) {
    console.error("Polling error:", err.message);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
