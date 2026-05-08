"use client";

import { useAuth } from "./authContext";

type PermissionCheck =
  | string
  | string[]
  | { any?: string[]; all?: string[] };

export default function usePermission(
  required: PermissionCheck
) {
  const { user, loading } = useAuth();

  if (loading) return false;
  if (!user) return false;

  const userPermissions = user.permissions || [];

  if (typeof required === "string") {
    return userPermissions.includes(required);
  }

  if (Array.isArray(required)) {
    return required.every((p) =>
      userPermissions.includes(p)
    );
  }

  if (required.any) {
    return required.any.some((p) =>
      userPermissions.includes(p)
    );
  }

  if (required.all) {
    return required.all.every((p) =>
      userPermissions.includes(p)
    );
  }

  return false;
}