"use client";

import { useEffect, useState } from "react";
import { Shield, Check, X, Clock, MessageSquare, Loader2 } from "lucide-react";
import api from "@/lib/api";

type Request = {
  _id: string;
  user: { email: string; userId: string };
  permission: { name: string; module: string };
  status: "PENDING" | "APPROVED" | "DENIED";
  reason?: string;
  createdAt: string;
};

export default function PermissionRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/permission-requests/list");
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReview = async (requestId: string, status: "APPROVED" | "DENIED") => {
    try {
      setProcessingId(requestId);
      const adminNotes = prompt(`Enter notes for ${status === 'APPROVED' ? 'Approval' : 'Denial'}:`);
      if (adminNotes === null) return;

      await api.post("/permission-requests/review", {
        requestId,
        status,
        adminNotes
      });

      fetchRequests();
    } catch (err) {
      console.error("Review failed", err);
      alert("Failed to process request");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading pending requests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Access Requests</h1>
        </div>
        <p className="text-muted-foreground">Review and approve permission requests from the Mailer team.</p>
      </header>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No pending requests at the moment.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    {req.user.email[0].toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-fg">{req.user.email}</span>
                      <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {req.user.userId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Requests access to:</span>
                      <span className="font-medium text-primary px-2 py-0.5 bg-primary/5 rounded border border-primary/10">
                        {req.permission.name}
                      </span>
                    </div>
                    {req.reason && (
                      <div className="mt-3 flex gap-2 text-xs text-muted-foreground italic bg-muted/30 p-2 rounded-lg">
                        <MessageSquare size={14} className="shrink-0" />
                        <span>"{req.reason}"</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto md:ml-0">
                  <button
                    onClick={() => handleReview(req._id, "DENIED")}
                    disabled={processingId === req._id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-600/5 hover:bg-red-600/10 border border-red-600/20 transition disabled:opacity-50"
                  >
                    <X size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview(req._id, "APPROVED")}
                    disabled={processingId === req._id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-600 bg-emerald-600/5 hover:bg-emerald-600/10 border border-emerald-600/20 transition disabled:opacity-50"
                  >
                    <Check size={16} />
                    Approve
                  </button>
                </div>
              </div>

              {processingId === req._id && (
                <div className="absolute inset-0 bg-bg/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
