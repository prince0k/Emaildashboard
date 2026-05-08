"use client";

import { useState } from "react";
import { Pencil, Power, Trash2, Globe, Mail, Calendar, Hash, Plus } from "lucide-react";
import type { Sender } from "@/types/sender";

type Props = {
  senders: Sender[];
  loading: boolean;
  onEdit: (sender: Sender) => void;
  onRefresh: () => void;
};

export default function SenderTable({ senders, loading, onEdit, onRefresh }: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const toggleSender = async (id: string, currentStatus: boolean) => {
    try {
      setProcessingId(id);

      const res = await fetch(`/api/senders/${id}`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || `Failed to ${currentStatus ? 'deactivate' : 'activate'} sender`);
        return;
      }

      onRefresh();
    } finally {
      setProcessingId(null);
    }
  };

  const deleteSender = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently remove sender "${name}"?`)) return;

    try {
      setProcessingId(id);

      const res = await fetch(`/api/senders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Removal failed");
        return;
      }

      onRefresh();
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 text-muted-foreground">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2" />
        <span>Loading senders...</span>
      </div>
    );
  }

  if (!senders?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-fg">No senders configured</h3>
            <p className="text-sm text-muted mt-1">
              Add a sender to start deploying campaigns.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Add Sender
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Name</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Code</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Provider</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Base URL</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Routes</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Priority</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Created</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">Status</th>
              <th className="px-5 py-3 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {senders.map((sender) => {
              const isProcessing = processingId === sender._id;

              return (
                <tr
                  key={sender._id}
                  className="group hover:bg-muted/5 transition-colors"
                >
                  {/* Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-fg">{sender.name}</span>
                    </div>
                  </td>

                  {/* Code */}
                  <td className="px-5 py-4 text-muted-foreground font-mono text-xs">
                    {sender.code}
                  </td>

                  {/* Provider */}
                  <td className="px-5 py-4 text-muted-foreground">
                    {sender.provider || "—"}
                  </td>

                  {/* Base URL */}
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground max-w-[200px] truncate" title={sender.baseUrl}>
                    <Globe className="w-3.5 h-3.5 inline mr-1" />
                    {sender.baseUrl}
                  </td>

                  {/* Routes count */}
                  <td className="px-5 py-4 text-fg">
                    <span className="inline-flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      {sender.routes?.length || 0}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4 text-fg font-medium">
                    {sender.priority ?? 0}
                  </td>

                  {/* Created */}
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {sender.createdAt
                        ? new Date(sender.createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                        ${
                          sender.active
                            ? "bg-emerald-500/10 text-emerald-600 text-primary"
                            : "bg-red-500/10 text-red-600 text-primary"
                        }
                      `}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sender.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {sender.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Edit */}
                      <button
                        onClick={() => onEdit(sender)}
                        disabled={isProcessing}
                        className="
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                          border border-border bg-bg text-fg
                          hover:bg-muted/10 hover:border-muted-foreground/20
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-primary/30
                          text-xs font-medium
                        "
                        title="Edit sender"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {/* Toggle Active/Inactive */}
                      <button
                        onClick={() => toggleSender(sender._id, sender.active)}
                        disabled={isProcessing}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                          border text-xs font-medium
                          transition-all duration-200
                          focus:outline-none focus:ring-2
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${
                            sender.active
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-600 text-primary hover:bg-amber-500/20 focus:ring-amber-500/30"
                              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-primary hover:bg-emerald-500/20 focus:ring-emerald-500/30"
                          }
                        `}
                        title={sender.active ? "Deactivate sender" : "Activate sender"}
                      >
                        {isProcessing ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {isProcessing ? "..." : (sender.active ? "Deactivate" : "Activate")}
                        </span>
                      </button>

                      {/* Delete (Remove) */}
                      <button
                        onClick={() => deleteSender(sender._id, sender.name)}
                        disabled={isProcessing}
                        className="
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                          border border-destructive/20 bg-destructive/10 text-destructive
                          hover:bg-destructive/20 hover:border-destructive/30
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-destructive/30
                          text-xs font-medium
                        "
                        title="Permanently remove sender"
                      >
                        {isProcessing ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {isProcessing ? "..." : "Remove"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}