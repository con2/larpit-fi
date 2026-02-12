/**
 * Typesafe translation magic.
 * Enforces all supported languages to have all the same translation keys as English.
 */

import type { Translations } from "./en";

import en from "./en";
import fi from "./fi";

// Re-export client-safe locale utilities
export {
  type SupportedLanguage,
  supportedLanguages,
  defaultLanguage,
  isSupportedLanguage,
  toSupportedLanguage,
} from "@/i18n/locales";

import { defaultLanguage, isSupportedLanguage } from "@/i18n/locales";

export const languages = { en, fi };

export function getTranslations(language: string): Translations {
  const supportedLanguage = isSupportedLanguage(language)
    ? language
    : defaultLanguage;
  return languages[supportedLanguage];
}
