"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState } from "./AppState";

function Sparkle({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zm7 11l.9 2.6 2.6.9-2.6.9L19 20l-.9-2.6-2.6-.9 2.6-.9L19 13zM5 15l.7 1.8 1.8.7-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7L5 15z" />
    </svg>
  );
}

export default function AskPanel({ context }) {
  const { deal, ratePct, assumptions, persona } = useAppState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box && messages.length) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const ask = async (question) => {
    if (!question.trim() || busy) return;
    const next = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })), deal, ratePct, assumptions, persona: persona.role, context }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply || `Error: ${data.error}`, tools: data.tools || [] }]);
    } catch (err) {
      setMessages([...next, { role: "assistant", content: `Error: ${err.message}` }]);
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-emerald-400 p-[1.5px] shadow-lg shadow-indigo-100">
      <div className="rounded-2xl bg-white">
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-violet-50 via-indigo-50 to-emerald-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow">
              <Sparkle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-900">Ask Gap Check</h3>
              <p className="text-xs text-slate-500">Powered by Claude · every number comes from the engine, never a guess</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="text-xs text-slate-500 hover:text-slate-800">
              Clear
            </button>
          )}
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {persona.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/60 px-3 py-1.5 text-left text-sm text-indigo-900 transition hover:border-indigo-400 hover:bg-indigo-100"
                  >
                    <Sparkle className="h-3.5 w-3.5 text-indigo-500" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-slate-900 px-4 py-2 text-sm text-white">{m.content}</div>
              </div>
            ) : (
              <div key={i} className="flex gap-2">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                  <Sparkle className="h-4 w-4" />
                </span>
                <Answer text={m.content} tools={m.tools} />
              </div>
            )
          )}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-indigo-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <Sparkle className="h-4 w-4 animate-pulse" />
              </span>
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
              </span>
              <span className="text-xs text-slate-500">Running the numbers…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length > 0 && !busy && (
          <div className="flex gap-2 overflow-x-auto px-5 pb-2">
            {persona.suggestions
              .filter((s) => !messages.some((m) => m.content === s))
              .slice(0, 3)
              .map((s) => (
                <button key={s} onClick={() => ask(s)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-700">
                  {s}
                </button>
              ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2 border-t border-slate-100 px-5 py-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this deal…"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white"
          />
          <button
            disabled={busy || !input.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow disabled:opacity-40"
          >
            <Sparkle className="h-4 w-4" />
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}

const TOOL_LABELS = {
  compute_gap: "State-law gap engine",
  list_programs: "Program directory",
  reviewer_rules: "BoA reviewer rules",
  review_current_deal: "Deal review",
};

function Answer({ text, tools = [] }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l)).map((l) => l.replace(/^[-•]\s+/, ""));
  const next = lines.find((l) => /^next:/i.test(l));
  const prose = lines.filter((l) => !/^[-•]\s/.test(l) && l !== next);
  const [headline, ...rest] = prose;

  return (
    <div className="max-w-[85%] overflow-hidden rounded-2xl rounded-tl-sm border border-indigo-100 bg-white text-sm text-slate-800 shadow-sm">
      <div className="px-4 pt-3">
        {headline && <p className="font-semibold text-slate-900">{headline}</p>}
        {rest.map((r, i) => (
          <p key={i} className="mt-1 text-slate-600">
            {r}
          </p>
        ))}
        {bullets.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-100">
            {bullets.map((b, i) => {
              const at = b.indexOf(": ");
              return at > 0 && at < 48 ? (
                <li key={i} className="flex items-baseline justify-between gap-4 py-1.5">
                  <span className="text-slate-500">{b.slice(0, at)}</span>
                  <span className="text-right font-semibold tabular-nums text-slate-900">{b.slice(at + 2)}</span>
                </li>
              ) : (
                <li key={i} className="py-1.5 text-slate-700">
                  {b}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {next && (
        <div className="mx-4 mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
          <span className="font-semibold">Next: </span>
          {next.replace(/^next:\s*/i, "")}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
        {tools.length > 0 && <span>Checked with</span>}
        {tools.map((t) => (
          <span key={t} className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-indigo-700">
            {TOOL_LABELS[t] || t}
          </span>
        ))}
        <span className="ml-auto">Synthetic deal · not financial advice</span>
      </div>
    </div>
  );
}
