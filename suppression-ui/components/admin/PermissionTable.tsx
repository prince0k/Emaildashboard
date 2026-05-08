"use client";

import { Trash2, Key, FolderKanban, Plus } from "lucide-react";
import { useState } from "react";

type Props = {
  permissions: any[];
  onDelete: (id: string) => void;
};

// Helper to generate consistent pastel color for module badges
const getModuleColor = (module: string) => {
  const hash = module.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 85%)`; // Light pastel background
};

export default function PermissionTable({ permissions, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string, permissionName: string) => {
    if (window.confirm(`Are you sure you want to delete the permission "${permissionName}"? This action cannot be undone.`)) {
      setDeletingId(id);
      // Simulate async delete; parent will handle actual deletion
      setTimeout(() => {
        onDelete(id);
        setDeletingId(null);
      }, 300);
    }
  };

  if (permissions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-fg">No permissions found</h3>
            <p className="text-sm text-muted mt-1">
              Create your first permission to define access controls.
            </p>
          </div>
          {/* Optional CTA – can be replaced or passed as prop */}
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Add Permission
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
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Permission
              </th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Module
              </th>
              <th className="px-5 py-3 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {permissions.map((perm) => (
              <tr
                key={perm._id}
                className="group hover:bg-muted/5 transition-colors"
              >
                {/* Permission name with icon */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Key className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-fg">{perm.name}</span>
                  </div>
                </td>

                {/* Module badge with dynamic color */}
                <td className="px-5 py-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getModuleColor(perm.module),
                      color: 'hsl(0, 0%, 20%)', // dark text for contrast
                    }}
                  >
                    <FolderKanban className="w-3 h-3" />
                    {perm.module}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => handleDelete(perm._id, perm.name)}
                    disabled={deletingId === perm._id}
                    className="
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                      border border-destructive/20 bg-destructive/10 text-destructive
                      hover:bg-destructive/20 hover:border-destructive/30
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-destructive/30
                      text-xs font-medium
                    "
                    title="Delete permission"
                  >
                    {deletingId === perm._id ? (
                      <>
                        <span className="animate-pulse">...</span>
                        <span className="hidden sm:inline">Deleting</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}