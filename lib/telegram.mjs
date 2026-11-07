export async function sendTelegram(text, chatId = process.env.TELEGRAM_CHAT_ID, { html = true } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN is not set in .env.local" };
  if (!chatId) return { ok: false, error: "TELEGRAM_CHAT_ID is not set. Send /start to your bot to get it." };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...(html && { parse_mode: "HTML", disable_web_page_preview: true }) }),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.description };
}

export async function fetchLatestRate(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 gapcheck-watcher" }, cache: "no-store" });
  const rows = (await res.text()).trim().split(/\r?\n/).filter(Boolean);
  const header = rows[0].split(",");
  const iDate = header.indexOf("date");
  const iRate = header.indexOf("pmms30");
  for (let i = rows.length - 1; i > 0; i--) {
    const cols = rows[i].split(",");
    const rate = parseFloat(cols[iRate]);
    if (!Number.isNaN(rate)) {
      const [m, d, y] = cols[iDate].split("/");
      return { rate, date: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` };
    }
  }
  throw new Error("No rate rows found");
}
