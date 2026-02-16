"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ImageCarousel from "@/components/ImageCarousel";
import { useTranslation } from 'react-i18next';

const galleryCategories = [
    {
        titleKey: "gallery_infrastructure_title",
        descriptionKey: "gallery_infrastructure_desc",
        images: [
            "/mega1.jpg",
            "/mega2.jpg",
            "/mega3.jpg",
            "/mega4.jpg",
        ],
    },
    {
        titleKey: "gallery_programme_launch_title",
        descriptionKey: "gallery_programme_launch_desc",
        images: [
            "pl15.jpeg",
            "pl16.jpeg",
            "pl17.jpeg",
            "pl18.jpeg",
            "pl1.jpg",
            "pl2.jpg",
            "pl3.jpg",
            "pl4.jpg",
            "pl5.jpg",
            "pl6.jpg",
            "pl7.jpg",
            "pl8.jpg",
            "pl9.jpg",
            "pl10.jpg",
            "pl11.jpg",
            "pl12.jpg",
            "pl13.jpg",
            "pl14.jpg",
        ],
    },
    {
        titleKey: "gallery_farmer_training_title",
        descriptionKey: "gallery_farmer_training_desc",
        images: [
            "mauda1.jpg",
            "mauda2.jpg",
            "mauda3.jpg",
            "mauda4.jpg",
            "mauda5.jpg",
            "mauda6.jpg",
            "mauda7.jpg",
            "mauda8.jpg",
            "mauda9.jpg",
            "mauda10.jpg",
        ],
    },
    {
        titleKey: "gallery_farmer_inauguration_title",
        descriptionKey: "gallery_farmer_inauguration_desc",
        images: [
            "/inaugartion1.jpg",
            "/inaugartion2.jpg",
            "/inaugartion3.jpg",
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
