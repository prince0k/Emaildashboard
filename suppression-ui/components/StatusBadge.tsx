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
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    PAUSED: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20",
      dot: "bg-amber-500",
    },
    STOPPED: {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/20",
      dot: "bg-red-500",
    },
    FAILED: {
      bg: "bg-red-600/15",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-600/30",
      dot: "bg-red-600",
    },
    SCHEDULED: {
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20",
      dot: "bg-blue-500",
    },
    COMPLETED: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border/60",
      dot: "bg-muted-foreground",
    },
  };

  const variant =
    styles[status] || {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border/60",
      dot: "bg-muted-foreground",
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