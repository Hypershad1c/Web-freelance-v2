import type { Metadata } from "next";
import { Suspense } from "react";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { CompareBar } from "@/components/properties/CompareBar";
import { AnalyticsRecorder } from "@/components/AnalyticsRecorder";

export const metadata: Metadata = {
  title: "Domify — Find Your Perfect Place",
  description:
    "Domify est la plateforme immobilière premium au Maroc : achat, location, estimation et accompagnement d'exception.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Providers>
          <Suspense fallback={null}>
            <AnalyticsRecorder />
          </Suspense>
          <Header />
          <main>{children}</main>
          <Footer />
          <CompareBar />
        </Providers>
      </body>
    </html>
  );
}
