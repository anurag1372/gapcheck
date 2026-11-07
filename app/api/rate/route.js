import { RATE } from "@/data/sources.mjs";
import { fetchLatestRate } from "@/lib/telegram.mjs";

export async function GET() {
  try {
    return Response.json({ ...(await fetchLatestRate(RATE.url)), source: RATE.url });
  } catch (err) {
    const last = RATE.history[RATE.history.length - 1];
    return Response.json({ rate: last.rate, date: last.date, cached: true, error: `Live fetch failed (${err.message}); using cached value.` });
  }
}
