import { Navigation } from "@/components/Navigation";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--larpit-default-font",
});

import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { routing } from "@/i18n/routing";
import { getTranslations } from "@/translations";
import "./globals.scss";
import "@con2/components/icons/material-symbol.css";

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
    title: `${translations.title} – ${translations.HomePage.tagline}`,
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return (
    <SessionProviderWrapper>
      <html
        lang={locale}
        className={geist.variable}
        data-scroll-behavior="smooth"
      >
        <body>
          <Navigation locale={locale} />
          <main>{children}</main>
        </body>
      </html>
    </SessionProviderWrapper>
  );
}
