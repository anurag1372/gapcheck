import { sendTelegram } from "@/lib/telegram.mjs";
import { rateAlertHTML } from "@/lib/telegramFormat.mjs";

export async function POST(req) {
  const body = await req.json();
  const text = body.type === "rate" ? rateAlertHTML({ ...body, simulated: true }) : body.text;
  return Response.json(await sendTelegram(text));
}
