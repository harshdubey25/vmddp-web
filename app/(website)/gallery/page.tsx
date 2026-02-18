"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ImageCarousel from "@/components/ImageCarousel";
import { useTranslation } from 'react-i18next';

interface GalleryItem {
    id: string;
    title: string;
    description: string;
    images: string[];
    image_count: number;
}

interface GalleryResponse {
    galleries: GalleryItem[];
    total?: number;
    language?: string;
    success: boolean;
    error?: string;
}

export default function Gallery() {
    const { t, i18n } = useTranslation('common');
    const [galleryCategories, setGalleryCategories] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGalleryData = async () => {
            try {
                setLoading(true);
                const language = i18n.language || 'en';

                const response = await fetch(
                    `/api/method/vmddp_app.api.api.get_gallery_cms_data?language=${language}`
                );
                if (!response.ok) {
                    throw new Error(`Failed to fetch gallery data: ${response.statusText}`);
                }
                const data: any = await response.json();

                const galleryData = data.message || data;

                if (!galleryData || !galleryData.success) {
                    throw new Error(galleryData?.error || 'Failed to load gallery');
                }

                const galleries = galleryData.galleries || [];
                setGalleryCategories(galleries);
                setError(null);
            } catch (err) {
                console.error('Error fetching gallery data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load gallery');
                setGalleryCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGalleryData();
    }, [i18n.language]);

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

                {loading && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">{t('loading') || 'Loading gallery...'}</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-12">
                        <p className="text-red-500">{error}</p>
                    </div>
                )}

                {!loading && !error && galleryCategories.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">{t('no_galleries_found') || 'No galleries found'}</p>
                    </div>
                )}

                {!loading && !error && galleryCategories.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {galleryCategories.map((gallery) => {
                            const images = gallery.images || [];
                            return (
                                <Card key={gallery.id} data-testid={`card-gallery-${gallery.id}`}>
                                    <CardHeader>
                                        <CardTitle className="font-display">{gallery.title}</CardTitle>
                                        <CardDescription>{gallery.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {images.length > 0 ? (
                                            <>
                                                <ImageCarousel images={images} alt={gallery.title} />
                                                <p className="text-sm text-muted-foreground mt-4 text-center">
                                                    {images.length} {images.length === 1 ? t('photo') : t('photos')}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                {t('no_images') || 'No images available'}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}