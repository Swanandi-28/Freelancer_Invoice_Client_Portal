import PortalShell from "@/components/PortalShell";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell role="client">{children}</PortalShell>;
}
