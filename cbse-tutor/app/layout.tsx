import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Biology Tutor - CBSE Edition",
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
      </body>
    </html>
  );
}
