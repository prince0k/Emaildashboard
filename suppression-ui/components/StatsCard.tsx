"use client";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  highlight?: "default" | "success" | "danger" | "warning";
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  highlight = "default",
}: StatsCardProps) {
  const highlightStyles = {
    default: "text-foreground",
    success: "text-emerald-500",
    danger: "text-red-500",
    warning: "text-amber-500",
  };

  const iconBgStyles = {
    default: "bg-muted",
    success: "bg-emerald-500/10",
    danger: "bg-red-500/10",
    warning: "bg-amber-500/10",
  };

  return (
    <div
      className="
        group relative overflow-hidden
        rounded-2xl border border-border/60
        bg-card/80 backdrop-blur-sm
        p-6
        shadow-soft
        transition-all duration-300 ease-smooth
        hover:-translate-y-1 hover:shadow-medium
      "
    >
      {/* subtle top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>

          <p
            className={`mt-3 text-3xl font-bold tracking-tight ${highlightStyles[highlight]}`}
          >
            {value}
          </p>
        </div>

        {Icon && (
          <div
            className={`
              flex items-center justify-center
              h-12 w-12 rounded-2xl
              border border-border/50
              ${iconBgStyles[highlight]}
              transition-all duration-300
              group-hover:scale-105
            `}
          >
            <Icon
              size={20}
              className="text-muted-foreground group-hover:text-primary transition-colors duration-300"
            />
          </div>
        )}
      </div>
    </div>
  );
}