"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import type { Sender } from "@/types/sender";
type SenderForm = {
  name: string;
  code: string;
  provider: string;   // 🔥 always string in form
  baseUrl: string;
  dba: string;
  priority: number;
  routes: Array<{
    vmta: string;
    domain: string;
    from_user: string;
    trackingDomain?: string;
  }>;
};

type Props = {
  sender?: Sender | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function SenderModal({ sender, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<SenderForm>({
  name: sender?.name || "",
  code: sender?.code || "",
  provider: sender?.provider || "",  // always string
  baseUrl: sender?.baseUrl || "",
  dba: sender?.dba || "",
  priority: sender?.priority ?? 1,
  routes:
    sender && sender.routes.length > 0
      ? sender.routes
      : [{ vmta: "", domain: "", from_user: "", trackingDomain: "" }],
});

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Focus trap (simple) – focus first input on mount
  useEffect(() => {
    const firstInput = document.querySelector<HTMLInputElement>(
      'input[name="name"]'
    );
    firstInput?.focus();
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.code.trim()) newErrors.code = "Code is required";
    if (!form.baseUrl.trim()) newErrors.baseUrl = "Base URL is required";

    form.routes.forEach((route, idx) => {
      if (!route.vmta.trim()) newErrors[`routes.${idx}.vmta`] = "VMTA required";
      if (!route.domain.trim()) newErrors[`routes.${idx}.domain`] = "Domain required";
      if (!route.from_user.trim()) newErrors[`routes.${idx}.from_user`] = "From User required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRouteChange = (index: number, field: string, value: string) => {
    const updated = [...form.routes];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, routes: updated });

    // Clear error for this field if exists
    const errorKey = `routes.${index}.${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const addRoute = () => {
    setForm({
      ...form,
      routes: [
        ...form.routes,
        { vmta: "", domain: "", from_user: "", trackingDomain: "" },
      ],
    });
  };

  const removeRoute = (index: number) => {
    const updated = form.routes.filter((_, i) => i !== index);
    setForm({ ...form, routes: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const method = sender ? "PUT" : "POST";
    const url = sender ? `/api/senders/${sender._id}` : `/api/senders`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || err.message || "Something went wrong");
        return;
      }

      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold text-fg">
            {sender ? "Edit Sender" : "Add Sender"}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Info */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="name"
                label="Name"
                value={form.name}
                onChange={(v) => {
                  setForm({ ...form, name: v });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                error={errors.name}
                required
                autoFocus
              />

              <Input
                name="code"
                label="Code"
                value={form.code}
                onChange={(v) => {
                  setForm({ ...form, code: v });
                  if (errors.code) setErrors({ ...errors, code: "" });
                }}
                error={errors.code}
                required
              />

              <Input
                name="provider"
                label="Provider"
                value={form.provider}
                onChange={(v) => setForm({ ...form, provider: v })}
              />

              <Input
                name="baseUrl"
                label="Base URL"
                value={form.baseUrl}
                onChange={(v) => {
                  setForm({ ...form, baseUrl: v });
                  if (errors.baseUrl) setErrors({ ...errors, baseUrl: "" });
                }}
                error={errors.baseUrl}
                required
                placeholder="https://api.example.com"
              />

              <Input
                name="dba"
                label="Company Address"
                value={form.dba}
                onChange={(v) => setForm({ ...form, dba: v })}
                placeholder="123 Market St, Suite 400, San Francisco, CA"
              />

              <Input
                name="priority"
                label="Priority"
                type="number"
                value={String(form.priority)}
                onChange={(v) =>
                  setForm({ ...form, priority: Math.max(1, Number(v)) })
                }
                min={1}
              />
            </div>
          </section>

          {/* Routes */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" />
                Routes
              </h3>

              <button
                type="button"
                onClick={addRoute}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border border-border bg-bg text-fg hover:bg-muted/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Route
              </button>
            </div>

            <div className="space-y-4">
              {form.routes.map((route, index) => (
                <div
                  key={index}
                  className="relative border border-border rounded-xl p-4 bg-muted/5"
                >
                  {form.routes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoute(index)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/30"
                      title="Remove route"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input
                      name={`routes.${index}.vmta`}
                      label="VMTA"
                      value={route.vmta}
                      onChange={(v) => handleRouteChange(index, "vmta", v)}
                      error={errors[`routes.${index}.vmta`]}
                      required
                    />

                    <Input
                      name={`routes.${index}.domain`}
                      label="Domain"
                      value={route.domain}
                      onChange={(v) => handleRouteChange(index, "domain", v)}
                      error={errors[`routes.${index}.domain`]}
                      required
                    />

                    <Input
                      name={`routes.${index}.from_user`}
                      label="From User"
                      value={route.from_user}
                      onChange={(v) => handleRouteChange(index, "from_user", v)}
                      error={errors[`routes.${index}.from_user`]}
                      required
                    />

                    <Input
                      name={`routes.${index}.trackingDomain`}
                      label="Tracking Domain"
                      value={route.trackingDomain || ""}
                      onChange={(v) => handleRouteChange(index, "trackingDomain", v)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              ))}
            </div>

            {form.routes.length === 0 && (
              <div className="text-center py-8 border border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground">No routes added yet.</p>
                <button
                  type="button"
                  onClick={addRoute}
                  className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add your first route
                </button>
              </div>
            )}
          </section>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-bg text-fg hover:bg-muted/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {sender ? "Update Sender" : "Create Sender"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Reusable Input Component */
/* Reusable Input Component */

type InputProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  min?: number;
  name?: string;
  autoFocus?: boolean;
};

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  error,
  placeholder,
  min,
  name,
  autoFocus,
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>

      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        min={min}
        autoFocus={autoFocus}
        className={`px-3 py-2 rounded-lg border bg-bg text-fg focus:outline-none focus:ring-2 transition ${
          error
            ? "border-destructive focus:ring-destructive/30"
            : "border-border focus:ring-primary/30"
        }`}
      />

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}