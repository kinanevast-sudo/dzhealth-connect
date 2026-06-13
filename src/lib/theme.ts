import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const KEY = "dzhealth-theme";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(KEY) as Theme) || "dark";
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const effective = t === "system" ? (systemPrefersDark() ? "dark" : "light") : t;
  if (effective === "light") root.classList.add("light");
  else root.classList.remove("light");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    const t = getStoredTheme();
    setTheme(t);
    applyTheme(t);
    if (t === "system" && typeof window !== "undefined") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mql.addEventListener?.("change", handler);
      return () => mql.removeEventListener?.("change", handler);
    }
  }, []);
  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(KEY, next);
    applyTheme(next);
  };
  const set = (t: Theme) => {
    setTheme(t);
    localStorage.setItem(KEY, t);
    applyTheme(t);
  };
  const isDark = theme === "system" ? systemPrefersDark() : theme === "dark";
  return { theme, toggle, set, isDark };
}
