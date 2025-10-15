"use client";
import { ReactNode } from "react";
import i18n from "i18next";
import { I18nextProvider } from "react-i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .use(Backend)
    .init({
      lng: "en",
      fallbackLng: "en",
      supportedLngs: ["en", "mr"],
      ns: ["common"],
      defaultNS: "common",
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
      },
      interpolation: {
        escapeValue: false,
      },
    });
}

export default function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
