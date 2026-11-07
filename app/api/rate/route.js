import { RATE } from "@/data/sources.mjs";

export async function GET() {
  try {
    const res = await fetch(RATE.url, { headers: { "User-Agent": "Mozilla/5.0 gapcheck-prototype" }, cache: "no-store" });
    const text = await res.text();
    const rows = text.trim().split(/\r?\n/).filter(Boolean);
    const header = rows[0].split(",");
    const iDate = header.indexOf("date");
    const iRate = header.indexOf("pmms30");
    for (let i = rows.length - 1; i > 0; i--) {
      const cols = rows[i].split(",");
      const rate = parseFloat(cols[iRate]);
      if (!Number.isNaN(rate)) {
        const [m, d, y] = cols[iDate].split("/");
        return Response.json({ rate, date: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`, source: RATE.url });
      }
    }
    throw new Error("No rate rows found");
  } catch (err) {
    const last = RATE.history[RATE.history.length - 1];
    return Response.json({ rate: last.rate, date: last.date, cached: true, error: `Live fetch failed (${err.message}); using cached value.` });
  }
}
