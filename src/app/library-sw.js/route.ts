import { readFile } from "node:fs/promises";
import { libraryRelease } from "@/components/launcher/release";

export const dynamic = "force-static";

export async function GET() {
  const worker = await readFile("src/components/launcher/library-worker.js", "utf8");
  return new Response(worker.replace("__RELEASE__", await libraryRelease()), {
    headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache" },
  });
}
