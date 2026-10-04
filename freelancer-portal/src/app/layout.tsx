import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freelancer Invoice & Client Portal",
  description: "Invoices, payments, files and messages for freelancers and their clients.",
};

// Fonts use the system font stack (see globals.css) so the app builds and
// runs without needing to download anything from Google Fonts.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
