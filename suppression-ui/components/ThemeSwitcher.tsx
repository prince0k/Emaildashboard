"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, ThemeOption } from "@/lib/themeContext";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Get active option details
  const activeOption = OPTIONS.find((o) => o.value === theme) || OPTIONS[2];
  const ActiveIcon = activeOption.icon;

  // Toggle dropdown open/close
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    setFocusedIndex(-1);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // Focus management when keyboard navigating
  useEffect(() => {
    if (focusedIndex >= 0 && optionsRefs.current[focusedIndex]) {
      optionsRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Handle keyboard events when dropdown is open/closed
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % OPTIONS.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + OPTIONS.length) % OPTIONS.length);
        break;
      case "Home":
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        event.preventDefault();
        setFocusedIndex(OPTIONS.length - 1);
        break;
      case "Tab":
        // Close dropdown when tabbing out
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (value: ThemeOption) => {
    setTheme(value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative z-50">
      {/* TRIGGER BUTTON */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Change theme. Current theme is ${theme}`}
        className="h-9 w-9 rounded-xl bg-panel/50 border border-border flex items-center justify-center text-text-secondary hover:text-foreground hover:border-border-bright hover:bg-hover/50 transition-all cursor-pointer"
      >
        <ActiveIcon size={16} className="transition-transform duration-300 group-hover:scale-110" />
      </button>

      {/* DROPDOWN OPTIONS LIST */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Theme options"
          className="absolute right-0 mt-2 w-36 bg-surface/90 backdrop-blur-xl border border-border rounded-xl p-1.5 shadow-2xl focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150"
          onKeyDown={handleKeyDown}
        >
          {OPTIONS.map((opt, idx) => {
            const isSelected = opt.value === theme;
            const Icon = opt.icon;

            return (
              <button
                key={opt.value}
                ref={(el) => {
                  optionsRefs.current[idx] = el;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={focusedIndex === idx ? 0 : -1}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all focus:outline-none focus:bg-hover/80",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-hover hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={cn(isSelected ? "text-primary" : "opacity-70")} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <Check size={12} className="text-primary stroke-[3px]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
