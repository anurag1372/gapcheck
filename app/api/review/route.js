import { reviewFile } from "@/lib/review.mjs";

export const maxDuration = 120;

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return Response.json({ error: "No file uploaded" }, { status: 400 });
    return Response.json(await reviewFile(file));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
