import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chat | Messaging",
  description: "Simple real-time chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white">
        {children}
      </body>
    </html>
  );
}
