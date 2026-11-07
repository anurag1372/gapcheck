import { runAgent } from "@/lib/agent.mjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { text, tools } = await runAgent(body);
    return Response.json({ reply: text, tools });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
