"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import api from "@/lib/api";

type Props = {
  users: any[];
  loading: boolean;
  onRefresh: () => void;
};

export default function UserTable({ users, loading, onRefresh }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) 
      return;

    setDeletingId(id);
    try {
      await api.delete("/users/delete", {
        data: { userId: id },
      });
      onRefresh();
    } catch (err) {
      alert("Failed to delete user. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading users...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="p-3 text-left font-medium">User ID</th>
              <th className="p-3 text-left font-medium">Email</th>
              <th className="p-3 text-left font-medium">Role</th>
              <th className="p-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className="border-t border-border hover:bg-muted/50 transition-colors"
              >
                <td className="p-3 font-mono text-xs">{user.userId}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">
                  <span className="inline-flex px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {user.role?.name || "No role"}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(user._id)}
                    disabled={deletingId === user._id}
                    className="
                      inline-flex items-center gap-1.5 px-2 py-1 text-xs
                      text-destructive hover:text-destructive/80
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/30 rounded
                    "
                    title="Delete user"
                  >
                    {deletingId === user._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete</span>
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span>No users found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}