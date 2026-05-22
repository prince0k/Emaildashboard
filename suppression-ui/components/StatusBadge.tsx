"use client";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<
    string,
    { bg: string; text: string; border: string; dot: string }
  > = {
    RUNNING: {
      bg: "bg-emerald/10",
      text: "text-emerald",
      border: "border-emerald/20",
      dot: "bg-emerald",
    },
    PAUSED: {
      bg: "bg-amber/10",
      text: "text-amber",
      border: "border-amber/20",
      dot: "bg-amber",
    },
    STOPPED: {
      bg: "bg-rose/10",
      text: "text-rose",
      border: "border-rose/20",
      dot: "bg-rose",
    },
    FAILED: {
      bg: "bg-rose/15",
      text: "text-rose",
      border: "border-rose/30",
      dot: "bg-rose",
    },
    SCHEDULED: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      dot: "bg-primary",
    },
    COMPLETED: {
      bg: "bg-panel",
      text: "text-text-secondary",
      border: "border-border/60",
      dot: "bg-text-muted",
    },
  };

  const variant =
    styles[status] || {
      bg: "bg-panel",
      text: "text-text-secondary",
      border: "border-border/60",
      dot: "bg-text-muted",
    };

  return (
    <span
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5
        rounded-full
        text-xs font-semibold tracking-wide
        border
        backdrop-blur-sm
        transition-all duration-200
        ${variant.bg}
        ${variant.text}
        ${variant.border}
      `}
    >
      <span
        className={`
          h-2 w-2 rounded-full
          ${variant.dot}
        `}
      />
      {status}
    </span>
  );
}