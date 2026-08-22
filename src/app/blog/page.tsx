import { JournalIndexView, journalMetadata } from "@/components/pages/JournalViews";

export const revalidate = 300;

export const metadata = journalMetadata("en");

export default function BlogIndexPage() {
  return <JournalIndexView locale="en" />;
}
