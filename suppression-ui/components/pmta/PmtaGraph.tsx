"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

export default function PmtaGraph({ data }: any) {

  return (
    <div className="card-glass p-4 h-[300px]">

      <h2 className="mb-2 text-sm">
        Sent vs Delivered Trend
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>

          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />

          {/* Sent line */}
          <Line
            type="monotone"
            dataKey="outbound"
            stroke="#22c55e"
            strokeWidth={2}
            />

            <Line
            type="monotone"
            dataKey="inbound"
            stroke="#3b82f6"
            strokeWidth={2}
            />

        </LineChart>
      </ResponsiveContainer>

    </div>
  )
}