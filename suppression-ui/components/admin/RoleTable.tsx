"use client";

import { Pencil, Trash2, Shield, Plus } from "lucide-react";
import { useState } from "react";

type Props = {
  roles: any[];
  onEdit: (role: any) => void;
  onDelete: (id: string) => void;
};

// Helper to generate a consistent pastel color based on permission name
const getPermissionColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 85%)`; // Light pastel, will adapt with opacity in dark mode
};

export default function RoleTable({ roles, onEdit, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string, roleName: string) => {
    if (window.confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      setDeletingId(id);
      // Simulate async delete (parent handles actual deletion)
      setTimeout(() => {
        onDelete(id);
        setDeletingId(null);
      }, 300);
    }
  };

  if (roles.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-fg">No roles found</h3>
            <p className="text-sm text-muted mt-1">
              Create your first role to start managing permissions.
            </p>
          </div>
          {/* Optional CTA – could be passed as prop or slot */}
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Add Role
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
                Role
              </th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Permissions
              </th>
              <th className="px-5 py-3 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map((role) => (
              <tr
                key={role._id}
                className="group hover:bg-muted/5 transition-colors"
              >
                {/* Role name & description */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-fg">{role.name}</div>
                      {role.description && (
                        <div className="text-xs text-muted mt-0.5">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Permissions */}
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {role.permissions?.length > 0 ? (
                      <>
                        {role.permissions.slice(0, 4).map((perm: any) => {
                          const permName = perm.name || perm;
                          return (
                            <span
                              key={perm._id || permName}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: getPermissionColor(permName),
                                color: 'hsl(0, 0%, 20%)', // dark text for light pastel
                              }}
                              title={permName}
                            >
                              {permName}
                            </span>
                          );
                        })}
                        {role.permissions.length > 4 && (
                          <span
                            className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full"
                            title={`${role.permissions.length - 4} more permissions`}
                          >
                            +{role.permissions.length - 4}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No permissions
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(role)}
                      className="
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                        border border-border bg-bg text-fg
                        hover:bg-muted/10 hover:border-muted-foreground/20
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-primary/30
                        text-xs font-medium
                      "
                      title="Edit role"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(role._id, role.name)}
                      disabled={deletingId === role._id}
                      className="
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                        border border-destructive/20 bg-destructive/10 text-destructive
                        hover:bg-destructive/20 hover:border-destructive/30
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-destructive/30
                        text-xs font-medium
                      "
                      title="Delete role"
                    >
                      {deletingId === role._id ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {deletingId === role._id ? "Deleting" : "Delete"}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}