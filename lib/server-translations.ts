import { headers } from "next/headers";
import enCommon from "../public/locales/en/common.json";
import mrCommon from "../public/locales/mr/common.json";

type TranslationKey = keyof typeof enCommon;

const translations = {
  en: {
    common: enCommon,
  },
  mr: {
    common: mrCommon,
  },
} as const;

type SupportedLocale = keyof typeof translations;

export async function getServerTranslations(locale?: string) {
  // If no locale is provided, try to get it from headers
  let currentLocale: SupportedLocale = "en";

  if (locale) {
    currentLocale = (
      translations[locale as SupportedLocale] ? locale : "en"
    ) as SupportedLocale;
  } else {
    try {
      const headersList = await headers();
      const acceptLanguage = headersList.get("accept-language");

      // Simple locale detection - you can make this more sophisticated
      if (acceptLanguage?.includes("mr")) {
        currentLocale = "mr";
      }
    } catch (error) {
      // If headers are not available (e.g., in static generation), default to 'en'
      console.warn("Headers not available, defaulting to English");
    }
  }

  const t = (key: TranslationKey): string => {
    const translation = translations[currentLocale]?.common[key];
    return typeof translation === "string" ? translation : key;
  };

  return { t, locale: currentLocale };
}

// For static usage without headers (like in generateMetadata)
export function getStaticTranslations(locale: SupportedLocale = "en") {
  const t = (key: TranslationKey): string => {
    const translation = translations[locale]?.common[key];
    return typeof translation === "string" ? translation : key;
  };

  return { t, locale };
}
