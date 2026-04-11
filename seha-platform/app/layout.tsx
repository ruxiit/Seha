import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { BookingProvider } from "@/lib/bookingStore";

// Self-hosted via next/font — zero layout shift, no render-blocking
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "صحة (Seha) — المنصة الوطنية للوصفات الرقمية",
  description: "منصة صحة: نظام التشفير نهاية لنهاية لإدارة الوصفات الطبية الرقمية بأمان تام.",
  keywords: ["وصفة طبية", "تشفير", "صحة", "الجزائر", "صيدلية"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`h-full antialiased ${ibmPlexArabic.variable}`}>
      <head>
        {/* Font Awesome — CDN is acceptable for icons (not render-blocking for icons) */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className="h-full flex flex-col bg-slate-50 text-slate-900 font-sans"
        suppressHydrationWarning
      >
        <Navbar />
        <BookingProvider>
          {children}
        </BookingProvider>
      </body>
    </html>
  );
}
