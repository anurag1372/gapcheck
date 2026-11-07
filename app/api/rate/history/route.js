import { RATE } from "@/data/sources.mjs";
import { fetchRateHistory } from "@/lib/telegram.mjs";

export async function GET() {
  try {
    return Response.json({ history: await fetchRateHistory(RATE.url, 8), live: true });
  } catch (err) {
    return Response.json({ history: RATE.history, live: false, error: err.message });
  }
}
