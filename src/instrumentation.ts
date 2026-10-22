// TEMPORARY — security-update runtime verification (PR #13). REMOVE BEFORE MERGE.
// Logs only the Node version to the deployment's private runtime logs, once per
// server instance start. No endpoint, no response change.
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  console.log(
    `[runtime-check] register node=${process.version} phase=${process.env.NEXT_PHASE ?? "server"}`,
  );
}
