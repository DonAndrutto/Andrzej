import { HomeView, homeMetadata } from "@/components/pages/HomeView";

export const metadata = homeMetadata("en");

export default function HomePage() {
  return <HomeView locale="en" />;
}
