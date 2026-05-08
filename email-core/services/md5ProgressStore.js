const progressMap = new Map();

export function initProgress(jobId, total) {
  progressMap.set(jobId, {
    total,
    completed: 0,
    failed: 0,
    status: "running",
  });
}

export function updateSuccess(jobId) {
  const job = progressMap.get(jobId);
  if (!job) return;

  job.completed++;
}

export function updateFail(jobId) {
  const job = progressMap.get(jobId);
  if (!job) return;

  job.failed++;
}

export function markDone(jobId) {
  const job = progressMap.get(jobId);
  if (!job) return;

  job.status = "done";
}

export function getProgress(jobId) {
  return progressMap.get(jobId);
}