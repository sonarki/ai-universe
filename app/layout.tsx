import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 고정 설계폭 뷰포트: 폰·패드에서 데스크톱 구도를 그대로 비율 축소해 표시 (모양 유지, 확대 허용)
export const viewport: Viewport = {
  width: "1200",
};

export const metadata: Metadata = {
  title: "AI Universe — Learn AI as One Connected Universe",
  description: "Explore AI's history, foundations, technologies, careers, risks and future through one connected bilingual learning universe.",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
