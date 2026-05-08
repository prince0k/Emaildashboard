export function validateTransition(currentStatus, nextStatus) {
  const validTransitions = {
    DEPLOYED: ["RUNNING"],   // 🔥 ADD THIS
    RUNNING: ["PAUSED", "STOPPED", "COMPLETED"],
    PAUSED: ["RUNNING", "STOPPED"],
    STOPPED: [],
    COMPLETED: [],
  };

  if (!currentStatus || !nextStatus) {
    return false;
  }

  return validTransitions[currentStatus]?.includes(nextStatus) || false;
}
