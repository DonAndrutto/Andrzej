import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

// Prerender a distinct worker for each deployment, including changes to Next's
// hashed bundles and fonts. Existing tabs finish using their current release.
export async function GET() {
  const worker = await readFile(path.join(process.cwd(), "src/components/launcher/library-worker.js"), "utf8");
  return new Response(worker.replace("__RELEASE__", randomUUID()), {
    headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache" },
  });
}
