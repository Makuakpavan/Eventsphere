import { LogoSpinner } from "@/components/ui/logo-spinner";

export function FullScreenLoader({
  text = "Loading EventSphere...",
  background = "rgba(255, 253, 249, 0.96)"
}: {
  text?: string;
  background?: string;
}) {
  return <LogoSpinner fullScreen size="large" text={text} background={background} />;
}
