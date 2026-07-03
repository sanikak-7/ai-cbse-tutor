import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI CBSE Biology & Chemistry Tutor",
  description:
    "Conversational AI tutor grounded in the CBSE senior-secondary biology syllabus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
