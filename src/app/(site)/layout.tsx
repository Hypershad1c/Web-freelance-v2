import type { Metadata } from "next";
import { Suspense } from "react";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { CompareBar } from "@/components/properties/CompareBar";
import { SellRentFloatingButton } from "@/components/SellRentFloatingButton";
import { AnalyticsRecorder } from "@/components/AnalyticsRecorder";
import { RuntimeLocaleTranslator } from "@/components/RuntimeLocaleTranslator";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { isRtl } from "@/i18n/locales";
import { pwaMetadata, pwaViewport } from "@/lib/pwa-metadata";

export const viewport = pwaViewport;

export const metadata: Metadata = {
  title: "Domify — Find Your Perfect Place",
  description:
    "Domify est la plateforme immobilière premium au Maroc : achat, location, estimation et accompagnement d'exception.",
  ...pwaMetadata,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <body className="antialiased">
        <Providers>
          <Suspense fallback={null}>
            <AnalyticsRecorder />
          </Suspense>
          <RuntimeLocaleTranslator locale={locale} />
          <Header locale={locale} dict={dict} />
          <main>{children}</main>
          <Footer locale={locale} dict={dict} />
          <CookieConsentBanner />
          <CompareBar />
          <SellRentFloatingButton />
        </Providers>
      </body>
    </html>
  );
}
