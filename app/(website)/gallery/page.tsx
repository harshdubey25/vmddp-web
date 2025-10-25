"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ImageCarousel from "@/components/ImageCarousel";
import { useTranslation } from 'react-i18next';

const galleryCategories = [
    {
        titleKey: "gallery_programme_launch_title",
        descriptionKey: "gallery_programme_launch_desc",
        images: [
            "/04-1_1759736734698.jpg",
            "/08_1759736734699.jpg",
        ],
    },
    {
        titleKey: "gallery_farmer_training_title",
        descriptionKey: "gallery_farmer_training_desc",
        images: [
            "/06-1_1759736734700.jpg",
            "/Training.jpg",
            "/08_1759736734699.jpg",
        ],
    },
    {
        titleKey: "gallery_success_stories_title",
        descriptionKey: "gallery_success_stories_desc",
        images: [
            "/cow-2755520_640_1759736734695.jpg",
            "/premium_photo-1677850455009-d67da2b774c9_1759736734697.jpg",
            "/01-1_1759736734698.jpg",
            "/17_1759736734699.jpg",
            "/18_1759736734700.jpg",
            "/b1_1759736734701.jpg",
            "/b2_1759736734701.jpg",
        ],
    },
    {
        titleKey: "gallery_infrastructure_title",
        descriptionKey: "gallery_infrastructure_desc",
        images: [
            "/cow-shed-1_1760444698185.webp",
            "/cow-2755520_640_1759736734695.jpg",
        ],
    },
];

export default function Gallery() {
    const { t } = useTranslation('common');

    return (
        <div className="min-h-[calc(100vh-16rem)] py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-gallery-title">
                        {t('gallery_title')}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t('gallery_subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {galleryCategories.map((category, index) => (
                        <Card key={index} data-testid={`card-gallery-${index}`}>
                            <CardHeader>
                                <CardTitle className="font-display">{t(category.titleKey)}</CardTitle>
                                <CardDescription>{t(category.descriptionKey)}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ImageCarousel images={category.images} alt={t(category.titleKey)} />
                                <p className="text-sm text-muted-foreground mt-4 text-center">
                                    {category.images.length} {category.images.length === 1 ? t('photo') : t('photos')}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
