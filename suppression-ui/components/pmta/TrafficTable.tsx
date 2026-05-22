"use client"

export default function TrafficTable({ traffic }: any) {

  const rows = [
    { label: "Total", key: "total" },
    { label: "Last Hour", key: "last_hour" },
    { label: "Top/Hour", key: "top_hour" },
    { label: "Last Min", key: "last_min" },
    { label: "Top/Min", key: "top_min" },
  ]

  return (
    <div className="card-glass p-4 overflow-auto">

      <h2 className="text-sm mb-3 font-medium">
        Traffic Overview
      </h2>

      <table className="w-full text-sm border-collapse">

        <thead className="text-muted-foreground">
          <tr className="border-b">
            <th className="text-left py-2">Metric</th>
            <th className="text-center py-2">Inbound</th>
            <th className="text-center py-2">Outbound</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const data = traffic?.[row.key] || {}

            return (
              <tr key={row.key} className="border-b">

                <td className="py-2">{row.label}</td>

                <td className="text-center py-2 text-emerald">
                  {data.inbound_msgs ?? 0}
                </td>

                <td className="text-center py-2 text-primary">
                  {data.outbound_msgs ?? 0}
                </td>

              </tr>
            )
          })}
        </tbody>

      </table>
    </div>
  )
}