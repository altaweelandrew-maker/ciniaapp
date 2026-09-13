import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "CineBook - Premium Cinema Ticket Booking",
  description:
    "Book cinema tickets online for IMAX, Dolby Cinema, and standard screenings with live seat selection, secure payment, and instant QR passes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07080C] text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-black">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
