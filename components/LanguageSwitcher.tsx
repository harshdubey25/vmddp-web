"use client";

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const router = useRouter();

    const handleLanguageChange = async (languageCode: string) => {
        try {
            await i18n.changeLanguage(languageCode);

            // Store language preference
            localStorage.setItem('i18nextLng', languageCode);

            // Update HTML lang attribute
            document.documentElement.lang = languageCode;

            // Force re-render by updating state (optional)
            // window.location.reload(); // Uncomment if needed for full page refresh
        } catch (error) {
            console.error('Error changing language:', error);
        }
    };

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    return (
        <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px]">
                <Languages className="w-4 h-4 mr-2" />
                <SelectValue>
                    <span className="flex items-center gap-2">
                        <span>{currentLanguage.flag}</span>
                        <span className="hidden sm:inline">{currentLanguage.name}</span>
                    </span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {languages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                        <span className="flex items-center gap-2">
                            <span>{language.flag}</span>
                            <span>{language.name}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}