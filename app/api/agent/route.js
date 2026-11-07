import { runAgent } from "@/lib/agent.mjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const reply = await runAgent(body);
    return Response.json({ reply });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
