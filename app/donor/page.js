"use client";

import Verdict from "@/components/Verdict";
import DemoIntro from "@/components/DemoIntro";
import AskPanel from "@/components/AskPanel";
import { useState } from "react";
import { useAppState } from "@/components/AppState";
import { Card, Stat, NumberInput } from "@/components/ui";
import { computeGap, usd } from "@/lib/engine.mjs";

export default function DonorPage() {
  const { deal, ratePct, assumptions } = useAppState();
  const [gift, setGift] = useState(25000);
  const g = computeGap(deal, ratePct, assumptions);

  const covered = [...deal.costs]
    .filter((c) => c.amount > 0)
    .sort((a, b) => a.amount - b.amount)
    .reduce(
      (acc, c) => {
        const take = Math.min(acc.left, c.amount);
        return { left: acc.left - take, items: take > 0 ? [...acc.items, { ...c, take }] : acc.items };
      },
      { left: gift, items: [] }
    ).items;

  const gapAfter = Math.max(g.gap - gift, 0);

  return (
    <div className="space-y-6">
      <Verdict />
      <AskPanel context={{ giftAmount: usd(gift), gapBeforeGift: usd(g.gap), gapAfterGift: usd(gapAfter) }} />
      <DemoIntro />
      <div>
        <p className="text-sm text-slate-500">Donor view</p>
        <h1 className="text-2xl font-semibold">If I give, what does it actually pay for?</h1>
        <p className="text-sm text-amber-700">{deal.note}</p>
      </div>

      <Card className="max-w-sm">
        <label className="text-sm">
          Gift amount
          <NumberInput value={gift} step={1000} onChange={setGift} className="mt-1" />
        </label>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Gap per home now" value={usd(g.gap)} tone="red" sub={`At ${ratePct}% mortgage rate`} />
        <Stat label="Your gift" value={usd(gift)} />
        <Stat label="Gap after your gift" value={usd(gapAfter)} tone={gapAfter === 0 ? "green" : "amber"} sub={gapAfter === 0 ? "This home is fully funded" : "Still to raise"} />
      </div>

      <Card>
        <h2 className="font-semibold">Your gift covers</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {covered.map((c) => (
            <li key={c.id} className="flex justify-between border-b border-slate-100 pb-2">
              <span>
                {c.take === c.amount ? "All of" : "Part of"} <b>{c.label}</b>
                <span className="block text-xs text-slate-400">{c.basis}</span>
              </span>
              <span>{usd(c.take)} of {usd(c.amount)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">The nonprofit issues any tax receipt. This is not tax advice.</p>
      </Card>
    </div>
  );
}
