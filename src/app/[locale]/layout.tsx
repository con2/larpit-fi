import { Navigation } from "@/components/Navigation";
import type { Metadata } from "next";
import { ReactNode } from "react";

import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--larpit-default-font",
});

import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { getTranslations } from "@/translations";
import "./globals.scss";

interface Props {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const translations = getTranslations(locale);

  return {
    title: `${translations.brand} – ${translations.HomePage.tagline}`,
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <SessionProviderWrapper>
      <html lang={locale} className={geist.variable}>
        <body>
          <Navigation locale={locale} />
          <main>{children}</main>
        </body>
      </html>
    </SessionProviderWrapper>
  );
}
