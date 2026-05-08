"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function OfferTabs({ offerId }) {
  const pathname = usePathname();
  const base = `/offers/${offerId}`;

  const tabs = [
    { label: "Creatives", href: `${base}/creatives` },
    { label: "Subject Lines", href: `${base}/subject-lines` },
    { label: "From Lines", href: `${base}/from-lines` },
  ];

  return (
    <div className="border-b border-border/60 mb-8">
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                relative px-4 py-2.5 text-sm font-semibold rounded-t-xl
                transition-all duration-200
                ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }
              `}
            >
              {tab.label}

              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}