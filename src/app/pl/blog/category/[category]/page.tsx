import type { Metadata } from "next";
import {
  CategoryView,
  categoryMetadata,
  categoryStaticParams,
} from "@/components/pages/JournalViews";

export const revalidate = 300;

interface Props {
  params: Promise<{ category: string }>;
}

export const generateStaticParams = categoryStaticParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return categoryMetadata("pl", category);
}

export default async function PolishCategoryPage({ params }: Props) {
  const { category } = await params;
  return <CategoryView locale="pl" category={category} />;
}
