"use client";

type Props = {
  count: number | null;
  loading?: boolean;
  sample?: string[];
  offerName?: string;
  segmentName?: string;
  filters?: {
    minOpen?: number;
    maxOpen?: number;
    minClick?: number;
    maxClick?: number;
  };
};

export default function SegmentPreview({
  count,
  loading,
  sample,
  filters,
  offerName,
  segmentName
}: Props) {

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <p className="text-sm text-text-muted animate-pulse">
          Calculating segment size...
        </p>
      </div>
    );
  }

  if (count === null) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <p className="text-sm text-text-muted">
          Run preview to estimate segment size
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          Segment Preview
        </h3>

        {offerName && (
          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
            {offerName}
          </span>
        )}
      </div>

      {segmentName && (
        <p className="text-xs text-emerald font-mono">
          Segment File: {segmentName}
        </p>
      )}

      {/* Count */}
      <div className="space-y-1">
        <p className="text-4xl font-bold text-primary">
          {count.toLocaleString()}
        </p>

        <p className="text-sm text-text-muted">
          Emails will be included in this segment
        </p>
      </div>

      {/* Filters */}
      {filters && (
        <div className="text-xs bg-panel p-3 rounded-lg space-y-1 text-text-secondary border border-border/50">
          {filters.minOpen && <div>Min Opens: {filters.minOpen}</div>}
          {filters.maxOpen && <div>Max Opens: {filters.maxOpen}</div>}
          {filters.minClick && <div>Min Clicks: {filters.minClick}</div>}
          {filters.maxClick && <div>Max Clicks: {filters.maxClick}</div>}
        </div>
      )}

      {/* Empty result */}
      {count === 0 && (
        <div className="text-rose text-sm bg-rose/10 border border-rose/20 p-3 rounded-lg">
          No emails match current filters
        </div>
      )}

      {/* Sample emails */}
      {sample && sample.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Sample Emails
          </p>

          <div className="text-xs font-mono bg-panel p-3 rounded-lg max-h-40 overflow-auto space-y-1 border border-border/50">
            {sample.map((row, i) => (
              <div key={i} className="truncate text-text-muted">
                {row}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}