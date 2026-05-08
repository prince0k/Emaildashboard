"use client";

import { useEffect, useState } from "react";
import { Server, Plus, Loader2 } from "lucide-react";
import SenderTable from "@/components/senders/SenderTable";
import SenderModal from "@/components/senders/SenderModal";
import type { Sender } from "@/types/sender";
import api from "@/lib/api";
export default function SendersPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingSender, setEditingSender] = useState<Sender | null>(null);

  const fetchSenders = async () => {
    try {
      setLoading(true);

      const res = await api.get("/senders");

      setSenders(res.data.senders || []);
    } catch (err) {
      console.error("Failed to load senders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSenders();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border shadow-sm p-6">
        {/* Optional subtle grid overlay – remove if bg-grid not defined */}
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Server className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-fg tracking-tight">
                Sender Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure and manage email senders
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Total senders stat */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg/50">
              <span className="text-xs text-muted-foreground">Total senders</span>
              <span className="text-lg font-semibold text-fg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : senders.length}
              </span>
            </div>

            <button
              onClick={() => {
                setEditingSender(null);
                setOpenModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Sender
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-muted/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/20 rounded w-1/4" />
                  <div className="h-3 bg-muted/20 rounded w-1/3" />
                </div>
                <div className="w-20 h-8 bg-muted/20 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <SenderTable
            senders={senders}
            loading={false}
            onEdit={(sender: Sender) => {
              setEditingSender(sender);
              setOpenModal(true);
            }}
            onRefresh={fetchSenders}
          />
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <SenderModal
          sender={editingSender}
          onClose={() => setOpenModal(false)}
          onSuccess={() => {
            fetchSenders();
            setOpenModal(false);
          }}
        />
      )}
    </div>
  );
}