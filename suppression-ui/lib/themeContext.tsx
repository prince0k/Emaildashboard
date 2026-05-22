"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeOption = "light" | "dark" | "system";

type ThemeContextType = {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const VALID_THEMES: ThemeOption[] = ["light", "dark", "system"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeOption>("system");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount (client-only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("app-theme") as ThemeOption | null;
      if (stored && VALID_THEMES.includes(stored)) {
        setThemeState(stored);
      } else {
        // Fallback and normalize invalid/missing values to 'system'
        localStorage.setItem("app-theme", "system");
        setThemeState("system");
      }
    } catch (e) {
      console.error("Failed to read theme from localStorage", e);
    }
    setMounted(true);
  }, []);

  // Compute resolved theme ('light' | 'dark')
  const getResolvedTheme = (currentTheme: ThemeOption): "light" | "dark" => {
    if (currentTheme === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "dark"; // Default SSR fallback matching initial HTML class
    }
    return currentTheme;
  };

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setResolvedTheme(getResolvedTheme(theme));
  }, [theme]);

  // Listen to system preference changes when in 'system' mode
  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setResolvedTheme(mediaQuery.matches ? "dark" : "light");
    };

    // Compatibility support for modern addEventListener and legacy addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  // Sync theme changes across browser tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "app-theme") {
        const newTheme = event.newValue as ThemeOption | null;
        if (newTheme && VALID_THEMES.includes(newTheme)) {
          setThemeState(newTheme);
        } else {
          setThemeState("system");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Apply resolved theme to document element and style colorScheme
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const root = document.documentElement;
    const isDark = resolvedTheme === "dark";

    root.classList.toggle("dark", isDark);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, mounted]);

  const setTheme = (newTheme: ThemeOption) => {
    if (typeof window === "undefined") return;

    const sanitizedTheme = VALID_THEMES.includes(newTheme) ? newTheme : "system";
    setThemeState(sanitizedTheme);

    try {
      localStorage.setItem("app-theme", sanitizedTheme);
    } catch (e) {
      console.error("Failed to write theme to localStorage", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
