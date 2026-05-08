"use client";

import { useState, useEffect } from "react";
import { X, Save, ShieldCheck, AlertCircle, CheckSquare, Square } from "lucide-react";

type Props = {
  role?: any;
  permissions: any[];
  onClose: () => void;
  onSaved: () => void;
};

export default function RoleModal({ role, permissions, onClose, onSaved }: Props) {
  const [name, setName] = useState(role?.name || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [selected, setSelected] = useState<string[]>(
    role?.permissions?.map((p: any) => p._id) || []
  );

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Auto-focus name input
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('input[name="name"]');
    input?.focus();
  }, []);

  // Group permissions by module
  const grouped = permissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Role name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const togglePermission = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleModule = (module: string, permIds: string[]) => {
    const allSelected = permIds.every((id) => selected.includes(id));
    if (allSelected) {
      // Deselect all in module
      setSelected((prev) => prev.filter((id) => !permIds.includes(id)));
    } else {
      // Select all in module
      setSelected((prev) => [...new Set([...prev, ...permIds])]);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    const method = role ? "PUT" : "POST";
    const url = role ? `/api/roles/${role._id}` : "/api/roles";

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissions: selected }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save role");
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
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-fg">
              {role ? "Edit Role" : "Create Role"}
            </h2>
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
        <div className="px-6 py-6 space-y-6">
          {/* Role Name */}
          <div className="space-y-1">
            <label htmlFor="name" className="text-xs text-muted-foreground flex items-center gap-1">
              Role Name
              <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({});
              }}
              placeholder="e.g., admin, editor, viewer"
              className={`
                w-full px-3 py-2 rounded-lg border bg-bg text-fg 
                focus:outline-none focus:ring-2 transition
                ${errors.name
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border focus:ring-primary/30"
                }
              `}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                Permissions
              </h3>
              <span className="text-xs text-muted-foreground">
                {selected.length} selected
              </span>
            </div>

            <div className="max-h-[320px] overflow-y-auto pr-2 space-y-5 scrollbar-thin scrollbar-thumb-muted/20">
              {Object.keys(grouped).map((module) => {
                const modulePerms = grouped[module];
                const modulePermIds = modulePerms.map((p: any) => p._id);
                const allSelected = modulePermIds.every((id: string) => selected.includes(id));
                const someSelected = modulePermIds.some((id: string) => selected.includes(id));

                return (
                  <div key={module} className="space-y-2">
                    {/* Module header with select-all */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-fg capitalize flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full" />
                        {module}
                      </h4>
                      <button
                        type="button"
                        onClick={() => toggleModule(module, modulePermIds)}
                        className="text-xs text-muted-foreground hover:text-fg transition-colors flex items-center gap-1"
                      >
                        {allSelected ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" />
                            Deselect all
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5" />
                            Select all
                          </>
                        )}
                      </button>
                    </div>

                    {/* Permission checkboxes */}
                    <div className="grid grid-cols-2 gap-2">
                      {modulePerms.map((perm: any) => {
                        const permName = perm.name.split(".")[1] || perm.name;
                        return (
                          <label
                            key={perm._id}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-lg border 
                              transition-all cursor-pointer group
                              ${selected.includes(perm._id)
                                ? "border-primary/30 bg-primary/5"
                                : "border-border bg-bg hover:bg-muted/10"
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={selected.includes(perm._id)}
                              onChange={() => togglePermission(perm._id)}
                              className="
                                w-4 h-4 rounded border-border 
                                text-primary focus:ring-primary/30
                                accent-primary
                              "
                            />
                            <span className="text-sm text-fg flex-1">{permName}</span>
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              {perm.module}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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