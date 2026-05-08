export type Theme = "light" | "dark";

const STORAGE_KEY = "app-theme";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY) as Theme | null;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme() {
  if (typeof window === "undefined") return;

  const stored = getStoredTheme();

  if (stored) {
    applyTheme(stored);
  } else {
    applyTheme("light"); // default
  }
}

export function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  applyTheme(isDark ? "light" : "dark");
}