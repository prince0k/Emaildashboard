"use client";

import { useState } from "react";
import SenderStatsTable from "./SenderStatsTable";
import SenderStatsFilters from "./SenderStatsFilters";

export default function SenderReportPage() {

  const [days, setDays] = useState(5);

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Sender Performance
      </h1>

      <SenderStatsFilters onChange={setDays} />

      <SenderStatsTable days={days} />

    </div>
  );
}