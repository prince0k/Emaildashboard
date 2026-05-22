"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const tags = ["show queue", "flush all", "pause domain", "stats"];

export function TerminalBar() {
  const [input, setInput] = useState("");

  const handleTagClick = (tag: string) => {
    setInput(`pmta ${tag}`);
  };

  return (
    <footer className="h-[42px] bg-surface border-t border-border flex items-center px-4 gap-4 z-40 relative">
      <div className="font-mono text-[11px] text-cyan flex gap-1.5 shrink-0">
        pmta@nyc-01 <span className="text-primary">›</span>
      </div>
      
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-[11px] caret-cyan placeholder:text-text-muted"
        placeholder="Type a command..."
      />

      <div className="hidden md:flex gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="bg-panel text-text-secondary font-mono text-[9px] px-2 py-1 rounded border border-border hover:border-primary hover:text-foreground transition-all uppercase tracking-tighter"
          >
            {tag}
          </button>
        ))}
      </div>
    </footer>
  );
}
