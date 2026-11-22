import { Launcher, launcherMetadata } from "@/components/launcher/Launcher";

export const metadata = launcherMetadata("en");

export default function Page() {
  return <Launcher locale="en" />;
}
