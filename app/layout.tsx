import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PUBG 豆子局",
  description: "PUBG 团队对局积分与房间协作结算。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
