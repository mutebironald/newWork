import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NewWork — AI-Native Workforce Activation",
  description:
    "Create, distribute, verify, measure, and report real economic opportunities for underserved workers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
