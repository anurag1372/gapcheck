import { readFile } from "node:fs/promises";
import path from "node:path";
import { RATE } from "@/data/sources.mjs";

export async function GET() {
  let state = null;
  try {
    state = JSON.parse(await readFile(path.join(process.cwd(), ".watch-state.json"), "utf8"));
  } catch {}
  return Response.json({
    running: Boolean(state?.lastCheck),
    source: RATE.url,
    intervalMin: Number(process.env.WATCH_INTERVAL_MIN || 60),
    telegramConnected: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    ...state,
  });
}
