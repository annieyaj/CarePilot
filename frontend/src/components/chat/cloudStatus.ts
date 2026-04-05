export function cloudStatusStillRunning(status: string) {
  return status === "created" || status === "idle" || status === "running";
}
