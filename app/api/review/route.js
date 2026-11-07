import { reviewFile } from "@/lib/review.mjs";
import { sendTelegram } from "@/lib/telegram.mjs";
import { reviewHTML } from "@/lib/telegramFormat.mjs";

export const maxDuration = 120;

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return Response.json({ error: "No file uploaded" }, { status: 400 });
    const result = await reviewFile(file);
    if (result.flags) result.telegram = await sendTelegram(reviewHTML({ fileName: file.name, flags: result.flags }));
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
