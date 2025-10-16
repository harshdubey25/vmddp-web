"use client";

import { useEffect } from 'react';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';

// Import translation files directly
import enCommon from '../public/locales/en/common.json';
import mrCommon from '../public/locales/mr/common.json';

const resources = {
    en: {
        common: enCommon,
    },
    mr: {
        common: mrCommon,
    },
};

// Initialize i18next instance
const i18nInstance = i18next.createInstance();

i18nInstance
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en',
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        react: {
            useSuspense: false,
        },
    });

const I18nProvider = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        // Set language from localStorage on client side
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('i18nextLng');
            if (savedLang && i18nInstance.language !== savedLang) {
                i18nInstance.changeLanguage(savedLang);
            }
            document.documentElement.lang = i18nInstance.language;
        }
    }, []);

    return (
        <I18nextProvider i18n={i18nInstance}>
            {children}
        </I18nextProvider>
    );
};

export default I18nProvider;