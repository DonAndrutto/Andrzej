import { Launcher, launcherMetadata } from "@/components/launcher/Launcher";

export const metadata = launcherMetadata("pl");

export default function Page() {
  return <Launcher locale="pl" />;
}
