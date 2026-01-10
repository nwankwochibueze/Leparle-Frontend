// src/context/homepage/HomepageContext.tsx
import { createContext } from "react";
import type { HeroBlock } from "../../types/homepage";

export interface HomepageContextValue {
  data: HeroBlock | null;
  loading: boolean;
}

export const HomepageContext =
  createContext<HomepageContextValue | null>(null);
