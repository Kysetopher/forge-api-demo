import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Forge API Demo",
  description: "Next.js starter with TypeScript and Tailwind"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
