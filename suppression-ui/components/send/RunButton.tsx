import React from "react";

interface RunButtonProps {
  mode: "TEST" | "LIVE";
  loading: boolean;
  started: boolean;
  suppressed: boolean;
  onClick: () => void;
}

export default function RunButton({
  mode,
  loading,
  started,
  suppressed,
  onClick,
}: RunButtonProps) {
  const disabled =
    loading ||
    started ||
    (mode === "LIVE" && !suppressed);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
w-full py-4 rounded-xl text-sm font-semibold transition-all
${disabled
  ? "bg-muted text-muted-foreground cursor-not-allowed"
  : "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-lg shadow-emerald-600/20"
}
`}
    >
      {loading ? "⏳ Starting..." : `▶ Start ${mode} Campaign`}
    </button>
  );
}