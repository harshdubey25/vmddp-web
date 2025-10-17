export const runtime = 'edge';
"use client"
import TrackApplicationForm from "@/components/TrackApplicationForm";
import { useTranslation } from 'react-i18next';

export default function Track() {
    const { t } = useTranslation('common');
    return (
        <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-track-title">
                        {t('track_title')}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t('track_subtitle')}
                    </p>
                </div>
                <TrackApplicationForm />
            </div>
        </div>
    );
}
