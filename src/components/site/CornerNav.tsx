import Link from "next/link";

/** Quiet top-right navigation between the app directory and the journal. */
export function CornerNav({ current }: { current: "home" | "journal" }) {
  return (
    <nav className="corner-nav" aria-label="Site">
      {current === "home" ? (
        <Link href="/blog">Journal →</Link>
      ) : (
        <Link href="/">← Home</Link>
      )}
    </nav>
  );
}
