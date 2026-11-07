"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/AppState";

export default function Home() {
  const { persona } = useAppState();
  const router = useRouter();
  useEffect(() => {
    router.replace(persona.path);
  }, [persona, router]);
  return <p className="text-slate-500">Loading your workspace…</p>;
}
