"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import CampaignTable from "@/components/CampaignTable";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import MiniAnalytics from "@/components/MiniAnalytics";
import api from "@/lib/api";
export default function CampaignManagerPage() {

  const [campaigns, setCampaigns] = useState<any[]>([]);
const campaignsRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sort, setSort] = useState<{
  sortBy: string;
  order: "asc" | "desc";
}>({
  sortBy: "createdAt",
  order: "desc",
});

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });

  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    from: "",
    to: "",
  });

  const [searchInput, setSearchInput] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      if (!campaigns.length) {
  setLoading(true);
}

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const queryObj: Record<string, string> = {
        page: String(pagination.page),
        limit: String(pagination.limit),
        sortBy: sort.sortBy,
        order: sort.order,
      };

      if (filters.search) queryObj.search = filters.search;
      if (filters.status) queryObj.status = filters.status;
      if (filters.from) queryObj.from = filters.from;
      if (filters.to) queryObj.to = filters.to;


      const res = await api.get("/campaigns", {
        params: queryObj,
        signal: controller.signal,
      });

      const json = res.data;

      setCampaigns(json.data || []);

      setPagination((prev) => ({
        ...prev,
        ...json.pagination,
      }));
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Fetch error", err);
      }
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filters.search,
    filters.status,
    filters.from,
    filters.to,
    sort.sortBy,
    sort.order,
  ]);

  /* Initial + dependency fetch */
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
  return () => {
    abortRef.current?.abort();
  };
}, []);

  /* Smart polling for RUNNING campaigns */
  useEffect(() => {
    if (!autoRefresh) return;

    const hasRunning = campaigns.some(
      (c) => c.status === "RUNNING"
    );

    if (!hasRunning) return;

    const interval = setInterval(fetchCampaigns, 8000);

    return () => clearInterval(interval);
  }, [campaigns, fetchCampaigns, autoRefresh]);

  /* Debounced search */
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));

      setFilters((prev) => {
        if (prev.search === searchInput) return prev;
        return { ...prev, search: searchInput };
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-6 shadow-soft">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Campaign Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Monitor, control and analyze live & scheduled campaigns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCampaigns}
            className="
              px-4 py-2 text-xs font-semibold
              rounded-xl
              border border-border/60
              bg-card/80 backdrop-blur-sm
              hover:bg-muted/40
              transition
            "
          >
            Refresh
          </button>

          <button
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`
              px-4 py-2 text-xs font-semibold
              rounded-xl border transition
              ${
                autoRefresh
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border/60"
              }
            `}
          >
            Auto Refresh: {autoRefresh ? "ON" : "OFF"}
          </button>
        </div>
        
      </div>

      {/* ANALYTICS PANEL */}
      <div className="w-full">
  <AnalyticsPanel />
</div>

      {/* TABLE */}
      {/* TABLE */}
<div className="w-full">
  {loading ? (
    <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl shadow-soft p-6 text-sm text-muted-foreground">
      Loading campaigns...
    </div>
  ) : (
    <CampaignTable
      campaigns={campaigns}
      pagination={pagination}
      filters={filters}
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      sort={sort}
      setSort={(newSort) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSort(newSort);
      }}
      onFilterChange={(newFilters) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setFilters(newFilters);
      }}
      onPageChange={(page) => {
        setPagination((prev) => ({ ...prev, page }));
      }}
      refresh={fetchCampaigns}
      onQuickView={(c) => setSelectedCampaign(c)}
    />
  )}
</div>

      {/* POPUP OUTSIDE TABLE */}
      {selectedCampaign && (
        <MiniAnalytics
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}