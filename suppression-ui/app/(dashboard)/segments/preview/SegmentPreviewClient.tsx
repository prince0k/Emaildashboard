"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import SegmentPreview from "@/components/segments/SegmentPreview";

export default function SegmentPreviewClient() {

  const searchParams = useSearchParams();

  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true);

  async function load() {
    try {

      const params = Object.fromEntries(searchParams.entries());

      const res = await api.get("/segments/preview", { params });

      setCount(res.data.count ?? 0);

    } catch (err) {

      console.error("Preview error", err);
      setCount(0);

    } finally {

      setLoading(false);

    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SegmentPreview
      count={count}
      
    />
  );
}