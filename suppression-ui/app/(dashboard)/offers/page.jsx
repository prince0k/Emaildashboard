"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  X,
  Check,
  Copy,
  Key,
  FileText,
  Archive,
  LayoutGrid,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const emptyForm = {
    sid: "",
    sponsor: "",
    cid: "",
    offer: "",
    vid: "",
    vertical: "",
    redirectLinks: "",
    optoutLink: "",
    optizmoAccessKey: "",
  };

  const [form, setForm] = useState(emptyForm);

  // Load offers
  const loadOffers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/offers");
      setOffers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  // Filter offers
  const visibleOffers = useMemo(() => {
    const q = search.toLowerCase();
    return offers.filter(
      (o) =>
        !o.isDeleted &&
        (!q ||
          o.sid?.toLowerCase().includes(q) ||
          o.cid?.toLowerCase().includes(q) ||
          o.offer?.toLowerCase().includes(q) ||
          o.sponsor?.toLowerCase().includes(q))
    );
  }, [offers, search]);

  // Stats
  const totalOffers = offers.filter((o) => !o.isDeleted).length;
  const activeOffers = offers.filter((o) => !o.isDeleted && o.isActive).length;

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!form.sid.trim()) errors.sid = "SID is required";
    if (!form.cid.trim()) errors.cid = "CID is required";
    if (!form.offer.trim()) errors.offer = "Offer name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const submit = async () => {
    if (!validateForm()) return;

    try {
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        redirectLinks: form.redirectLinks
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      };

      if (editId) {
        await api.put(`/offers/${editId}`, payload);
      } else {
        await api.post("/offers", payload);
      }

      setSuccess(editId ? "Offer updated successfully" : "Offer created successfully");
      setTimeout(() => setSuccess(""), 2500);
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      loadOffers();
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 1500);
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/offers/${id}/status`, { isActive: !currentStatus });
      loadOffers();
    } catch {
      setError("Failed to update status");
    }
  };

  const deleteOffer = async (id) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      await api.delete(`/offers/${id}`);
      loadOffers();
    } catch {
      setError("Failed to delete offer");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header with Stats */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border shadow-sm p-6">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <LayoutGrid className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-fg tracking-tight">
                Offers
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage offer configuration and Optizmo metadata
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl border border-border bg-bg/50">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="ml-2 text-lg font-semibold text-fg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : totalOffers}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl border border-border bg-bg/50">
                <span className="text-xs text-muted-foreground">Active</span>
                <span className="ml-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : activeOffers}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setForm(emptyForm);
                setEditId(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              New Offer
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Search */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <input
          placeholder="Search by SID, CID, Sponsor, Offer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Offer</th>
                <th className="px-5 py-3 text-left font-medium">SID</th>
                <th className="px-5 py-3 text-left font-medium">CID</th>
                <th className="px-5 py-3 text-left font-medium">Files</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                // Skeleton rows
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 bg-muted/20 rounded w-32" />
                      <div className="h-3 bg-muted/20 rounded w-24 mt-2" />
                    </td>
                    <td className="px-5 py-4"><div className="h-4 bg-muted/20 rounded w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-muted/20 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-muted/20 rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-muted/20 rounded-full w-16" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-muted/20 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : visibleOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p>No offers found</p>
                  </td>
                </tr>
              ) : (
                visibleOffers.map((o) => (
                  <tr key={o._id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-fg">{o.offer}</div>
                      <div className="text-xs text-muted-foreground mt-1">{o.sponsor}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">{o.sid}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{o.cid}</span>
                        <button
                          onClick={() => copyToClipboard(o.cid)}
                          className="text-muted-foreground hover:text-fg transition"
                          title="Copy CID"
                        >
                          {copied === o.cid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="font-mono">{o.md5FileName || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Archive className="w-3.5 h-3.5" />
                          <span className="font-mono">{o.zipFileName || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                          ${
                            o.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }
                        `}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${o.isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {o.isActive ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/offers/${o._id}`}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                          title="Manage creatives & lines"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setForm({
                              ...o,
                              redirectLinks: (o.redirectLinks || []).join("\n"),
                            });
                            setEditId(o._id);
                            setShowForm(true);
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition"
                          title="Edit offer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(o._id, o.isActive)}
                          className={`p-2 rounded-lg transition ${
                            o.isActive
                              ? "text-amber-500 hover:bg-amber-500/10"
                              : "text-emerald-500 hover:bg-emerald-500/10"
                          }`}
                          title={o.isActive ? "Pause" : "Activate"}
                        >
                          {o.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteOffer(o._id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                          title="Delete offer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-fg">
                {editId ? "Edit Offer" : "Create Offer"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-muted/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Core Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="SID"
                    value={form.sid}
                    onChange={(v) => setForm({ ...form, sid: v })}
                    error={formErrors.sid}
                    required
                  />
                  <InputField
                    label="Sponsor"
                    value={form.sponsor}
                    onChange={(v) => setForm({ ...form, sponsor: v })}
                  />
                  <InputField
                    label="CID"
                    value={form.cid}
                    onChange={(v) => setForm({ ...form, cid: v })}
                    error={formErrors.cid}
                    required
                  />
                  <InputField
                    label="Offer Name"
                    value={form.offer}
                    onChange={(v) => setForm({ ...form, offer: v })}
                    error={formErrors.offer}
                    required
                  />
                  <InputField
                    label="VID"
                    value={form.vid}
                    onChange={(v) => setForm({ ...form, vid: v })}
                  />
                  <InputField
                    label="Vertical"
                    value={form.vertical}
                    onChange={(v) => setForm({ ...form, vertical: v })}
                  />
                </div>
              </div>

              {/* Links */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full" />
                  Links
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Redirect Links (one per line)
                    </label>
                    <textarea
                      rows={4}
                      value={form.redirectLinks}
                      onChange={(e) => setForm({ ...form, redirectLinks: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="https://example.com/redirect1&#10;https://example.com/redirect2"
                    />
                  </div>
                  <InputField
                    label="Opt-out Link"
                    value={form.optoutLink}
                    onChange={(v) => setForm({ ...form, optoutLink: v })}
                  />
                </div>
              </div>

              {/* Optizmo */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full" />
                  Optizmo Configuration
                </h3>
                <InputField
                  label="Access Key"
                  value={form.optizmoAccessKey}
                  onChange={(v) => setForm({ ...form, optizmoAccessKey: v })}
                  icon={<Key className="w-4 h-4 text-muted-foreground" />}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-border bg-bg text-fg hover:bg-muted/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition"
              >
                <Plus className="w-4 h-4" />
                {editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable input field with error
function InputField({ label, value, onChange, error, required, icon, type = "text" }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full px-3 py-2 rounded-lg border bg-bg text-fg
            focus:outline-none focus:ring-2 transition
            ${icon ? "pl-9" : ""}
            ${
              error
                ? "border-destructive focus:ring-destructive/30"
                : "border-border focus:ring-primary/30"
            }
          `}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}