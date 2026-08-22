import type { Metadata } from "next";
import {
  PostView,
  postMetadata,
  postStaticParams,
} from "@/components/pages/PostView";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = postStaticParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return postMetadata("pl", slug);
}

export default async function PolishPostPage({ params }: Props) {
  const { slug } = await params;
  return <PostView locale="pl" slug={slug} />;
}
