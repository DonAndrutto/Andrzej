import { notFound } from "next/navigation";

/**
 * Anything unmatched under /pl is a Polish page that does not exist, so it
 * gets the Polish "not found" (src/app/pl/not-found.tsx) rather than the
 * English one the root boundary would serve.
 */
export default function PolishCatchAll(): never {
  notFound();
}
