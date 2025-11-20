import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SchemeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  componentId: number;
  index: number;
  isInView: boolean;
  backgroundImage?: string;
}

export default function SchemeCard({ icon: Icon, title, description, benefits, componentId, index, isInView, backgroundImage }: SchemeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
  <Card 
        className="hover-elevate transition-all duration-300 h-full flex flex-col relative overflow-hidden" 
        style={{ height: '380px' }} 
        data-testid={`card-scheme-${componentId}`}
      >
        {/* Background Image */}
        {backgroundImage && (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80" />
          </>
        )}
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col h-full">
        <CardHeader className="p-3 sm:p-5">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-3"
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </motion.div>
          <CardTitle className="font-display text-sm sm:text-base line-clamp-2" data-testid={`text-scheme-title-${componentId}`}>{title}</CardTitle>
          <CardDescription className="text-xs sm:text-sm line-clamp-2" data-testid={`text-scheme-description-${componentId}`}>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-3 sm:p-5 pt-0">
          <div className="flex-1">
            <ul className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3">
              {benefits.map((benefit, benefitIndex) => (
                <motion.li
                  key={benefitIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.4 + benefitIndex * 0.1 }}
                  className="flex items-start gap-2 text-xs sm:text-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                  <span className="text-muted-foreground">{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center pb-2">
            <Link href={`/schemes/${componentId}`}>
              <Button variant="outline" className="w-36 sm:w-40 text-xs sm:text-sm group" data-testid={`button-learn-more-${componentId}`}>
                Read More
                <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
