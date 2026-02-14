import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "つくばホワイト歯科 管理",
  description: "つくばホワイト歯科 管理ダッシュボード",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
