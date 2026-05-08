"use client";

import { useEffect, useState } from "react";
import { X, UserPlus, Save, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function UserModal({ onClose, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    roleName?: string;
  }>({});

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Auto-focus email input
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('input[name="email"]');
    input?.focus();
  }, []);

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await api.get("/roles");
        setRoles(res.data.roles);
      } catch (err) {
        console.error("Role load failed", err);
      } finally {
        setLoadingRoles(false);
      }
    }
    loadRoles();
  }, []);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!roleName) {
      newErrors.roleName = "Please select a role";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post("/users/create", {
        email,
        password,
        roleName,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || "User creation failed");
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
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-fg">Create User</h2>
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
        <div className="px-6 py-6 space-y-4">
          <InputField
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            placeholder="user@example.com"
            required
          />

          <InputField
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder="Enter secure password"
            required
          />

          {/* Role Select */}
          <div className="space-y-1">
            <label htmlFor="role" className="text-xs text-muted-foreground flex items-center gap-1">
              Role
              <span className="text-destructive">*</span>
            </label>
            <select
              id="role"
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value);
                if (errors.roleName) setErrors((prev) => ({ ...prev, roleName: undefined }));
              }}
              disabled={loadingRoles}
              className={`
                w-full px-3 py-2 rounded-lg border bg-bg text-fg
                focus:outline-none focus:ring-2 transition
                disabled:opacity-50 disabled:cursor-not-allowed
                ${errors.roleName
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border focus:ring-primary/30"
                }
              `}
            >
              <option value="">
                {loadingRoles ? "Loading roles..." : "Select a role"}
              </option>
              {roles.map((role) => (
                <option key={role._id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.roleName && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors.roleName}
              </p>
            )}
          </div>
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
            onClick={handleSubmit}
            disabled={loading || loadingRoles}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced input field with error display
function InputField({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  required,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
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
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (error) onChange(e.target.value); // parent will clear error
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