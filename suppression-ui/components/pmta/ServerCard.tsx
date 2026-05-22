type Props = {
  item: any
}

export default function ServerCard({ item }: Props) {

  const totalQueueRcpt = Array.isArray(item.queues)
    ? item.queues.reduce((sum: number, q: any) => sum + (q.rcpt || 0), 0)
    : 0

  const outbound = item.traffic?.total?.outbound_msgs || 0
  const inbound = item.traffic?.total?.inbound_msgs || 0

  return (
    <div className="card-glass p-4 hover:scale-[1.02] transition cursor-pointer">

      {/* Header */}
      <div className="flex justify-between mb-3">
        <div>
          <h2 className="font-medium">
            {item.server?.name || item.server}
          </h2>
          <div className="text-xs text-muted-foreground">
            {item.uptime || "—"}
          </div>
        </div>

        <div
          className={
            item.status === "running"
              ? "text-emerald"
              : "text-rose"
          }
        >
          {item.status || "unknown"}
        </div>
      </div>

      {/* 🔥 TRAFFIC TABLE STYLE */}
      <div className="text-sm space-y-1 font-mono">

          <div className="flex justify-between">
          <span className="text-muted-foreground">Inbound</span>
          <span className="text-primary">
            {inbound.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Outbound</span>
          <span className="text-emerald">
            {outbound.toLocaleString()}
          </span>
        </div>

        

        <div className="flex justify-between border-t pt-2 mt-2">
          <span className="text-muted-foreground">Queue Rcpt</span>
          <span className="text-amber">
            {totalQueueRcpt.toLocaleString()}
          </span>
        </div>

      </div>

    </div>
  )
}