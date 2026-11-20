import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import DemoBanner from "@/components/common/DemoBanner";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export const metadata: Metadata = {
  title: "MedFinder - Smart Medicine Availability & Pharmacy Locator",
  description: "Find prescribed medicines in nearby pharmacies using prescription uploads or live medicine search. Check real-time stock, prices, and locations.",
  keywords: "medicine locator, pharmacy finder, prescription ocr, medicine stock, prescription upload, nearby chemist",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        <AuthProvider>
          <DemoBanner />
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

