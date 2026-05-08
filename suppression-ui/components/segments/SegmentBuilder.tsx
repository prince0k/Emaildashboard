"use client";

import { useState, useEffect } from "react";
import * as Select from "@radix-ui/react-select";
import api from "@/lib/api";
import SegmentPreview from "./SegmentPreview";
import { ChevronDown } from "lucide-react";
export default function SegmentBuilder() {
  // State
  const [type, setType] = useState("click");
  const [isp, setIsp] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sample, setSample] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [sort, setSort] = useState("");
  const [segments, setSegments] = useState<any[]>([]);
  const [sourceSegment, setSourceSegment] = useState("");
  const [offers, setOffers] = useState<any[]>([]);
  const [offerId, setOfferId] = useState("");
  const [sendingDomain, setSendingDomain] = useState("");
  const [vmta, setVmta] = useState("");
  const [minOpen, setMinOpen] = useState<number | "">("");
  const [maxOpen, setMaxOpen] = useState<number | "">("");
  const [minClick, setMinClick] = useState<number | "">("");
  const [maxClick, setMaxClick] = useState<number | "">("");
  const [segmentName, setSegmentName] = useState<string>();
  const selectClass =
  "w-full bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";
  // Helpers
  const handleNumberChange = (setter: (v: number | "") => void) => 
    (e: React.ChangeEvent<HTMLInputElement>) => 
      setter(e.target.value === "" ? "" : Number(e.target.value));

  const buildParams = () => ({
    type,
    isp: isp || undefined,
    offerId: offerId || undefined,
    from: from || undefined,
    to: to || undefined,
    shuffle: shuffle || undefined,
    sort: sort || undefined,
    sourceSegment: sourceSegment || undefined,
    sendingDomain: sendingDomain || undefined,
    vmta: vmta || undefined,
    minOpen: minOpen || undefined,
    maxOpen: maxOpen || undefined,
    minClick: minClick || undefined,
    maxClick: maxClick || undefined,
  });

  // Data fetching
  useEffect(() => {
    Promise.all([
      api.get("/offers").then(res => setOffers(res.data || [])),
      api.get("/segments/list").then(res => setSegments(res.data || []))
    ]).catch(err => console.error("LOAD ERROR", err));
  }, []);

  // Reset count when filters change
  useEffect(() => {
    setCount(null);
  }, [type, isp, offerId, from, to, sendingDomain, vmta, minOpen, maxOpen, minClick, maxClick]);

  // Preview
  const preview = async () => {
    setLoading(true);
    try {
      const res = await api.get("/segments/preview", { params: buildParams() });
      setCount(res.data.count ?? 0);
      setSample(res.data.sample ?? []);
    } catch (err: any) {
      console.error("PREVIEW ERROR:", err.response?.data || err);
      alert("Preview failed");
    } finally {
      setLoading(false);
    }
  };

  // Generate
  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/segments/build", buildParams());
      setSegmentName(res.data.segment);
      alert(`Segment Created\n\nName: ${res.data.segment}\nEmails: ${res.data.count}`);
      await api.get("/segments/list").then(res => setSegments(res.data || []));
      setCount(null);
      setSample([]);
    } catch (err: any) {
      console.error("BUILD ERROR:", err.response?.data || err);
      alert("Segment generation failed");
    } finally {
      setLoading(false);
    }
  };

  // Field definitions for repetitive inputs
  const numberFilters = [
    { label: "Min Opens", value: minOpen, setter: setMinOpen },
    { label: "Max Opens", value: maxOpen, setter: setMaxOpen },
    { label: "Min Clicks", value: minClick, setter: setMinClick },
    { label: "Max Clicks", value: maxClick, setter: setMaxClick },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm max-w-6xl">
      {/* Type */}
      <p className="text-sm font-semibold">Filters</p>
      <div className="grid grid-cols-2 gap-4">
        
      <Select.Root
  value={type}
  onValueChange={(v) => {
    setType(v)
    setMinOpen("")
    setMaxOpen("")
    setMinClick("")
    setMaxClick("")
  }}
>
  <Select.Trigger className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm flex justify-between items-center">
    <Select.Value placeholder="Select Type" />
    <ChevronDown size={16} className="opacity-60" />
  </Select.Trigger>
<Select.Portal>
  <Select.Content className="bg-card border border-border rounded-lg shadow-lg mt-1">
    <Select.Viewport>

      <Select.Item value="click" className="px-3 py-2 hover:bg-muted cursor-pointer">
        <Select.ItemText>Clicked Emails</Select.ItemText>
      </Select.Item>

      <Select.Item value="open" className="px-3 py-2 hover:bg-muted cursor-pointer">
        <Select.ItemText>Opened Emails</Select.ItemText>
      </Select.Item>

      <Select.Item value="both" className="px-3 py-2 hover:bg-muted cursor-pointer">
        <Select.ItemText>Opened or Clicked</Select.ItemText>
      </Select.Item>

    </Select.Viewport>
  </Select.Content>
  </Select.Portal>
</Select.Root>

    
      
        <Select.Root
  value={isp || "all"}
  onValueChange={(v) => setIsp(v === "all" ? "" : v)}
>
  <Select.Trigger className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm flex justify-between items-center">
    <Select.Value placeholder="All ISP" />
    <ChevronDown size={16} className="opacity-60" />
  </Select.Trigger>

  <Select.Portal>
    <Select.Content className="bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">

      <Select.Viewport>

        <Select.Item value="all" className="px-3 py-2 hover:bg-muted cursor-pointer">
          <Select.ItemText>All ISP</Select.ItemText>
        </Select.Item>

        {["gmail","yahoo","outlook","hotmail","aol"].map((item) => (
          <Select.Item
            key={item}
            value={item}
            className="px-3 py-2 hover:bg-muted cursor-pointer"
          >
            <Select.ItemText>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Select.ItemText>
          </Select.Item>
        ))}

      </Select.Viewport>

    </Select.Content>
  </Select.Portal>
</Select.Root>
      

      
      <Select.Root
  value={offerId || "all"}
  onValueChange={(v) => setOfferId(v === "all" ? "" : v)}
>
  <Select.Trigger className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm flex justify-between items-center">
    <Select.Value placeholder="All Offers" />
    <ChevronDown size={16} className="opacity-60" />
  </Select.Trigger>

  <Select.Portal>
    <Select.Content className="bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
      <Select.Viewport>

        <Select.Item value="all" className="px-3 py-2 hover:bg-muted cursor-pointer">
          <Select.ItemText>All Offers</Select.ItemText>
        </Select.Item>

        {offers.map(o => (
          <Select.Item
            key={o._id}
            value={o._id}
            className="px-3 py-2 hover:bg-muted cursor-pointer"
          >
            <Select.ItemText>
              {o.offer} | {o.cid} | {o.sponsor}
            </Select.ItemText>
          </Select.Item>
        ))}

      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>

      {/* Source Segment */}
      
     <Select.Root
  value={sourceSegment || "none"}
  onValueChange={(v) => setSourceSegment(v === "none" ? "" : v)}
>
  <Select.Trigger className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm flex justify-between items-center">
    <Select.Value placeholder="No Source Segment" />
    <ChevronDown size={16} className="opacity-60" />
  </Select.Trigger>

  <Select.Portal>
    <Select.Content className="bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
      <Select.Viewport>

        <Select.Item value="none" className="px-3 py-2 hover:bg-muted cursor-pointer">
          <Select.ItemText>No Source Segment</Select.ItemText>
        </Select.Item>

        {segments.map((seg) => (
          <Select.Item
            key={seg.file}
            value={seg.file}
            className="px-3 py-2 hover:bg-muted cursor-pointer"
          >
            <Select.ItemText>
              {seg.name} ({seg.count})
            </Select.ItemText>
          </Select.Item>
        ))}

      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>

      {/* Text inputs */}
      <input
        placeholder="Sending Domain"
        value={sendingDomain}
        onChange={e => setSendingDomain(e.target.value)}
        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input 
      placeholder="VMTA"
      value={vmta} 
      onChange={e => setVmta(e.target.value)} 
      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
</div>
      {/* Date Range */}

      <p className="text-sm font-semibold">Date Range</p>
      <div className="grid grid-cols-2 gap-3">
        
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Number filters */}
      <p className="text-sm font-semibold">Engagement Limits</p>

        <div className="grid grid-cols-2 gap-3">

          {(type === "open" || type === "both") && (
            <>
              <input
                type="number"
                placeholder="Min Opens"
                value={minOpen}
                onChange={handleNumberChange(setMinOpen)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <input
                type="number"
                placeholder="Max Opens"
                value={maxOpen}
                onChange={handleNumberChange(setMaxOpen)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </>
          )}

          {(type === "click" || type === "both") && (
            <>
              <input
                type="number"
                placeholder="Min Clicks"
                value={minClick}
                onChange={handleNumberChange(setMinClick)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <input
                type="number"
                placeholder="Max Clicks"
                value={maxClick}
                onChange={handleNumberChange(setMaxClick)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </>
          )}

        </div>

      <div className="grid grid-cols-2 gap-4">

  <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-4 py-2">
    <span className="text-sm font-medium">
      Shuffle Emails
    </span>

    <input
      type="checkbox"
      checked={shuffle}
      onChange={e => setShuffle(e.target.checked)}
      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
    />
  </div>

  <Select.Root
    value={sort || "none"}
    onValueChange={(v) => setSort(v === "none" ? "" : v)}
  >
    <Select.Trigger className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm flex justify-between items-center">
      <Select.Value placeholder="No Sorting" />
      <ChevronDown size={16} className="opacity-60" />
    </Select.Trigger>

    <Select.Portal>
      <Select.Content className="bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
        <Select.Viewport>

          <Select.Item value="none" className="px-3 py-2 hover:bg-muted cursor-pointer">
            <Select.ItemText>No Sorting</Select.ItemText>
          </Select.Item>

          <Select.Item value="asc" className="px-3 py-2 hover:bg-muted cursor-pointer">
            <Select.ItemText>Sort A → Z</Select.ItemText>
          </Select.Item>

          <Select.Item value="desc" className="px-3 py-2 hover:bg-muted cursor-pointer">
            <Select.ItemText>Sort Z → A</Select.ItemText>
          </Select.Item>

        </Select.Viewport>
      </Select.Content>
    </Select.Portal>

  </Select.Root>

</div>

      {/* Actions */}
      <button
        onClick={preview}
        disabled={loading}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Calculating..." : "Preview"}
      </button>

      <SegmentPreview
        count={count}
        loading={loading}
        sample={sample}
        offerName={offers.find(o => o._id === offerId)?.offer}
        segmentName={segmentName}
        filters={{
          minOpen: minOpen === "" ? undefined : minOpen,
          maxOpen: maxOpen === "" ? undefined : maxOpen,
          minClick: minClick === "" ? undefined : minClick,
          maxClick: maxClick === "" ? undefined : maxClick,
        }}
      />

      {segmentName && (
        <p className="text-xs text-green-700 font-mono">Segment File: {segmentName}</p>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
      >
        Generate Segment
      </button>
    </div>
  );
}