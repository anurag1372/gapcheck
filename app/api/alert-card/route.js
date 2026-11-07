import { alertCard } from "@/lib/alertCard";
import { SYNTHETIC_DEAL } from "@/data/deal.mjs";

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  return alertCard({
    deal: SYNTHETIC_DEAL,
    oldRate: Number(q.get("old") || 7.18),
    newRate: Number(q.get("new") || 7.32),
    rateDate: q.get("date") || "",
    title: q.get("title") || "Rate alert",
  });
}
