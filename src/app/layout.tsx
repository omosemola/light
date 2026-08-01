import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus Marketplace",
  description: "A premium, modern, mobile-first multi-vendor campus marketplace.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1E1B4B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAF7] text-[#18181B] font-body">
        <AuthProvider>
          <TopNav />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
