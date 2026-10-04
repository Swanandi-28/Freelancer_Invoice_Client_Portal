import PortalShell from "@/components/PortalShell";

export default function FreelancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell role="freelancer">{children}</PortalShell>;
}
