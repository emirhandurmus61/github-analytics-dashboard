"use client";

import { createContext, useContext, type ReactNode } from "react";

const TzContext = createContext("UTC");

/** The viewer's timezone as resolved on the server, so SSR and hydration agree on "today". */
export function TzProvider({ tz, children }: { tz: string; children: ReactNode }) {
  return <TzContext.Provider value={tz}>{children}</TzContext.Provider>;
}

export const useTz = () => useContext(TzContext);
