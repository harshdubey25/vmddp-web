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
}

export default function SchemeCard({ icon: Icon, title, description, benefits, componentId, index, isInView }: SchemeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
  <Card className="hover-elevate transition-all duration-300 h-full flex flex-col" style={{ height: '420px' }} data-testid={`card-scheme-${componentId}`}>
        <CardHeader>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
            className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
          >
            <Icon className="w-6 h-6 text-primary" />
          </motion.div>
          <CardTitle className="font-display" data-testid={`text-scheme-title-${componentId}`}>{title}</CardTitle>
          <CardDescription data-testid={`text-scheme-description-${componentId}`}>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 justify-between">
          <div>
            <ul className="space-y-2 mb-6">
              {benefits.map((benefit, benefitIndex) => (
                <motion.li
                  key={benefitIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.4 + benefitIndex * 0.1 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                  <span className="text-muted-foreground">{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center">
            <Link href={`/schemes/${componentId}`}>
              <Button variant="outline" className="w-40 group" data-testid={`button-learn-more-${componentId}`}>
                Learn More
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
