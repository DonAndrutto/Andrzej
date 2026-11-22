import { createHash } from "node:crypto";
import { glob, readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

// Version the installable library and its shared UI dependencies. Journal
// entries and uploaded post images are served by the regular journal.
const sources = [
  "src/components/launcher/**/*", "src/components/site/ViewSwitch*",
  "src/app/{library,library-app,library-sw.js}/**/*", "src/app/pl/library/**/*",
  "src/app/{layout.tsx,globals.css,icon.svg}", "src/app/pl/layout.tsx",
  "src/lib/{apps.tsx,site-config.ts,i18n/config.ts}",
  "public/{launcher-icons,library-app}/**/*", "package-lock.json", "next.config.ts",
];

export async function GET() {
  const files: string[] = [];
  for await (const entry of glob(sources, { withFileTypes: true })) {
    if (entry.isFile()) files.push(path.relative(process.cwd(), path.join(entry.parentPath, entry.name)));
  }
  const hash = createHash("sha256");
  for (const file of files.sort()) {
    hash.update(file).update("\0").update(await readFile(file)).update("\0");
  }
  const worker = await readFile("src/components/launcher/library-worker.js", "utf8");
  return new Response(worker.replace("__RELEASE__", hash.digest("hex")), {
    headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache" },
  });
}
