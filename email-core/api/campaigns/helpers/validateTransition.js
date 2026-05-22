export function validateTransition(currentStatus, nextStatus) {
  const validTransitions = {
    DRAFT: ["CREATED"],
    CREATED: ["RUNNING", "SCHEDULED"],
    SCHEDULED: ["RUNNING", "PAUSED", "STOPPED"],
    DEPLOYED: ["RUNNING"],
    RUNNING: ["PAUSED", "STOPPED", "COMPLETED"],
    PAUSED: ["RUNNING", "STOPPED"],
    STOPPED: [],
    COMPLETED: [],
  };

  if (!currentStatus || !nextStatus) {
    return false;
  }

  // Allow identical transition to act as idempotency safety
  if (currentStatus === nextStatus) return true;

  return validTransitions[currentStatus]?.includes(nextStatus) || false;
}
