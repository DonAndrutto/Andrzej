import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function NotFound() {
  return (
    <>
      <header className="journal-header">
        <p className="dharma-mark">Not Found</p>
        <h1 className="journal-title">
          Gone <em>elsewhere</em>
        </h1>
        <div className="title-rule" aria-hidden="true">
          <span className="diamond"></span>
        </div>
        <p className="journal-intro">
          The page you are looking for does not exist — like all conditioned
          things, it may simply have moved on.
        </p>
      </header>
      <p className="empty-state">
        <Link href="/">Return home</Link> · <Link href="/blog">Browse the journal</Link>
      </p>
      <SiteFooter />
    </>
  );
}
