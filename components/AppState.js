"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PERSONAS } from "@/data/personas.mjs";
import { SYNTHETIC_DEAL } from "@/data/deal.mjs";
import { DEFAULT_ASSUMPTIONS, RATE } from "@/data/sources.mjs";

const AppContext = createContext(null);
const STORAGE_KEY = "gapcheck-state-v1";
const DEFAULT_HOUSEHOLD = { size: 4, income: 95000, city: "Santa Ana" };
const latestRate = RATE.history[RATE.history.length - 1];

export function AppStateProvider({ children }) {
  const [personaId, setPersonaId] = useState("finance");
  const [deal, setDeal] = useState(SYNTHETIC_DEAL);
  const [ratePct, setRatePct] = useState(latestRate.rate);
  const [rateInfo, setRateInfo] = useState({ date: latestRate.date, live: false });
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [household, setHousehold] = useState(DEFAULT_HOUSEHOLD);
  const [loaded, setLoaded] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        if (saved.personaId) setPersonaId(saved.personaId);
        if (saved.deal) setDeal(saved.deal);
        if (saved.assumptions) setAssumptions(saved.assumptions);
        if (saved.household) setHousehold(saved.household);
      }
    } catch {}
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ personaId, deal, assumptions, household }));
  }, [loaded, personaId, deal, assumptions, household]);

  const pathname = usePathname();
  const persona = PERSONAS.find((p) => p.path === pathname) || PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];
  const resetDeal = () => {
    setDeal(SYNTHETIC_DEAL);
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setRatePct(latestRate.rate);
    setHousehold(DEFAULT_HOUSEHOLD);
  };

  return (
    <AppContext.Provider
      value={{ persona, setPersonaId, deal, setDeal, ratePct, setRatePct, rateInfo, setRateInfo, assumptions, setAssumptions, household, setHousehold, resetDeal }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppState = () => useContext(AppContext);
