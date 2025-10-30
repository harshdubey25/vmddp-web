"use client"
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

export default function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 9000);
    return () => clearInterval(interval);
  }, [emblaApi]);


  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative">

      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {images.map((image, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0">
              <div className="aspect-video bg-muted">
                <img
                  src={image}
                  alt={`${alt} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  data-testid={`carousel-image-${index}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Left/Right Arrows */}
      <button
        type="button"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border/50 rounded-full p-2"
        onClick={scrollPrev}
        aria-label="Previous image"
        style={{outline: 'none'}}
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button
        type="button"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border/50 rounded-full p-2"
        onClick={scrollNext}
        aria-label="Next image"
        style={{outline: 'none'}}
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      </button>


      <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium border border-border/50" data-testid="carousel-counter">
        {selectedIndex + 1} / {images.length}
      </div>
    </div>
  );
}
