import { HomeView, homeMetadata } from "@/components/pages/HomeView";

export const metadata = homeMetadata("pl");

export default function PolishHomePage() {
  return <HomeView locale="pl" />;
}
