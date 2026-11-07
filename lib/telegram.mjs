export async function sendTelegram(text, chatId = process.env.TELEGRAM_CHAT_ID) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN is not set in .env.local" };
  if (!chatId) return { ok: false, error: "TELEGRAM_CHAT_ID is not set. Send /start to your bot to get it." };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.description };
}
