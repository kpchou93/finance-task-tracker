import type { Metadata } from "next";
import "./globals.css";
import "./friendly.css";

export const metadata: Metadata = {
  title: "Finance Task Tracker",
  description: "Stay on top of finance deadlines across your companies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
