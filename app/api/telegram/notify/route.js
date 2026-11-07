import { sendTelegram, sendTelegramPhoto } from "@/lib/telegram.mjs";
import { rateCaptionHTML } from "@/lib/telegramFormat.mjs";
import { alertCard } from "@/lib/alertCard";

export async function POST(req) {
  const body = await req.json();
  if (body.type !== "rate") return Response.json(await sendTelegram(body.text));
  const png = Buffer.from(await alertCard({ ...body, title: "Rate alert (simulated)" }).arrayBuffer());
  return Response.json(await sendTelegramPhoto(png, rateCaptionHTML({ ...body, simulated: true })));
}
