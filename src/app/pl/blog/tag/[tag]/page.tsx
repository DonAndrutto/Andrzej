import type { Metadata } from "next";
import {
  TagView,
  tagMetadata,
  tagStaticParams,
} from "@/components/pages/JournalViews";

export const revalidate = 300;

interface Props {
  params: Promise<{ tag: string }>;
}

export const generateStaticParams = tagStaticParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return tagMetadata("pl", tag);
}

export default async function PolishTagPage({ params }: Props) {
  const { tag } = await params;
  return <TagView locale="pl" tag={tag} />;
}
