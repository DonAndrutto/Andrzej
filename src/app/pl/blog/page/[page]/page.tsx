import type { Metadata } from "next";
import {
  JournalPageView,
  journalPageMetadata,
  journalPagesStaticParams,
} from "@/components/pages/JournalViews";

export const revalidate = 300;

interface Props {
  params: Promise<{ page: string }>;
}

export const generateStaticParams = journalPagesStaticParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return journalPageMetadata("pl", page);
}

export default async function PolishBlogPagePage({ params }: Props) {
  const { page } = await params;
  return <JournalPageView locale="pl" page={page} />;
}
