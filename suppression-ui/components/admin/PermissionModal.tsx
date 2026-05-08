"use client";

import { useState, useEffect } from "react";
import { X, Save, Shield, AlertCircle } from "lucide-react";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

export default function PermissionModal({ onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [module, setModule] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; module?: string }>({});

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Auto-focus first input
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('input[name="name"]');
    input?.focus();
  }, []);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Permission name is required";
    if (!module.trim()) newErrors.module = "Module is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, module }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create permission");
        return;
      }

      onSaved();
      onClose();
    } catch (error) {
      alert("An error occurred");
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
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-fg">Create Permission</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          <InputField
            name="name"
            label="Permission Name"
            value={name}
            onChange={setName}
            error={errors.name}
            placeholder="user.manage"
            required
          />
          <InputField
            name="module"
            label="Module"
            value={module}
            onChange={setModule}
            error={errors.module}
            placeholder="user"
            required
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-bg text-fg hover:bg-muted/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
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
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable input field with error display
function InputField({
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs text-muted-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Clear error on change
          if (error) onChange(e.target.value); // parent will handle clearing via state update
        }}
        placeholder={placeholder}
        className={`
          w-full px-3 py-2 rounded-lg border bg-bg text-fg 
          focus:outline-none focus:ring-2 transition
          ${error
            ? "border-destructive focus:ring-destructive/30"
            : "border-border focus:ring-primary/30"
          }
        `}
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