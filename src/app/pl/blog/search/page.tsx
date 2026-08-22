import type { Metadata } from "next";
import { SearchView, searchMetadata } from "@/components/pages/JournalViews";

/** Search results are query-dependent and rendered on demand. */
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string | string[] }>;
}

function firstQuery(q?: string | string[]): string {
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return searchMetadata("pl", firstQuery(q) || undefined);
}

export default async function PolishSearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  return <SearchView locale="pl" query={firstQuery(q)} />;
}
