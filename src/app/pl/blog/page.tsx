import { JournalIndexView, journalMetadata } from "@/components/pages/JournalViews";

export const revalidate = 300;

export const metadata = journalMetadata("pl");

export default function PolishBlogIndexPage() {
  return <JournalIndexView locale="pl" />;
}
