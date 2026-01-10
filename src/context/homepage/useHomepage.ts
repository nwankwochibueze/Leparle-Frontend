// src/context/homepage/useHomepage.ts
import { useContext } from "react";
import { HomepageContext } from "./HomepageContext";

export const useHomepage = () => {
  const context = useContext(HomepageContext);

  if (!context) {
    throw new Error("useHomepage must be used within HomepageProvider");
  }

  return context;
};
