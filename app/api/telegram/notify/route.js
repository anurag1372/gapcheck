import { sendTelegram } from "@/lib/telegram.mjs";

export async function POST(req) {
  const { text } = await req.json();
  const result = await sendTelegram(text);
  return Response.json(result);
}
