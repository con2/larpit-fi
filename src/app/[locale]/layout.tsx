import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { ReactNode } from "react";

import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--larpit-default-font",
});

import "./globals.scss";
import { getTranslations } from "@/translations";

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
    title: `${translations.brand} – ${translations.Home.tagline}`,
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <html lang={locale} className={geist.variable}>
      <body>
        <Navigation locale={locale} />
        <main>{children}</main>
      </body>
    </html>
  );
}
