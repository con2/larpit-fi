import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import AppBar from "@/components/AppBar";
import Footer from "@/components/Footer";
import { NewVersionNoticeProvider } from "@/components/NewVersionNotice";
import ReloadButton from "@/components/ReloadButton";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import AutoThemeSync from "@/components/ui/AutoThemeSync";
import { CommandPaletteProvider } from "@/components/ui/CommandPalette";
import HeroMessage, { heroActionClasses } from "@/components/ui/HeroMessage";
import { featureFlags } from "@/config";
import { routing } from "@/i18n/routing";
import {
  autoThemeScript,
  parseThemePreference,
  themeCookieName,
  toBootstrapTheme,
} from "@/theme";
import { getTranslations } from "@/translations";
import { fontVariableClassNames } from "./fonts";
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
  const translations = getTranslations(locale);
  const themePreference = featureFlags.nordicNight
    ? parseThemePreference((await cookies()).get(themeCookieName)?.value)
    : "day";
  const typeTitles = Object.fromEntries(
    Object.entries(translations.Larp.attributes.type.choices).map(
      ([type, choice]) => [type, choice.title],
    ),
  ) as Record<keyof typeof translations.Larp.attributes.type.choices, string>;
  const newVersionT = translations.NewVersionPage;
  const newVersionNotice = (
    <HeroMessage
      eyebrow={newVersionT.eyebrow}
      title={newVersionT.title}
      lede={newVersionT.lede}
    >
      <ReloadButton
        className={heroActionClasses.primary}
        label={newVersionT.reload}
      />
    </HeroMessage>
  );

  return (
    <SessionProviderWrapper>
      <html
        lang={locale}
        className={fontVariableClassNames}
        data-scroll-behavior="smooth"
        data-larpit-theme={themePreference}
        data-bs-theme={toBootstrapTheme(themePreference)}
        // The auto theme script sets data-bs-theme before hydration.
        suppressHydrationWarning
      >
        <head>
          {featureFlags.nordicNight && (
            <script dangerouslySetInnerHTML={{ __html: autoThemeScript }} />
          )}
        </head>
        <body>
          {featureFlags.nordicNight && <AutoThemeSync />}
          <CommandPaletteProvider
            locale={locale}
            messages={translations.CommandPalette}
            themeSwitching={featureFlags.nordicNight}
            typeTitles={typeTitles}
          >
            <div className="lf-page">
              <AppBar locale={locale} />
              <main>
                <NewVersionNoticeProvider notice={newVersionNotice}>
                  {children}
                </NewVersionNoticeProvider>
              </main>
              <Footer locale={locale} />
            </div>
          </CommandPaletteProvider>
        </body>
      </html>
    </SessionProviderWrapper>
  );
}
