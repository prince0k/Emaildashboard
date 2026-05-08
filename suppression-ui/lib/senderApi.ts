/**
 * senderApi.ts
 * -------------
 * PURPOSE:
 * Helper layer if later you expose sender info
 * (currently minimal, future-safe)
 */

export const senderApi = {
  listSenders() {
    return [
      { id: "s1", name: "Primary Sender" },
      { id: "s2", name: "Backup Sender" },
    ];
  },
};
