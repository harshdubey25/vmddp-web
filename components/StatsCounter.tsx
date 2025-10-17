"use client"
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from 'react-i18next';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  testId: string;
  index: number;
}

function StatCard({ icon, value, label, color, testId, index }: StatCardProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="p-6 border-l-4" style={{ borderLeftColor: color }} data-testid={testId}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="font-display font-bold text-3xl" data-testid={`${testId}-value`}>
              {count.toLocaleString()}
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color + '20' }}
          >
            {icon}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function StatsCounter() {
  const { t } = useTranslation('common');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-12 sm:py-16 bg-muted/30" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-display font-semibold text-2xl sm:text-3xl mb-3" data-testid="text-stats-title">
            {t('stats_title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('stats_subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-6 h-6 text-chart-2" />}
            value={1247}
            label={t('total_applications')}
            color="hsl(var(--chart-2))"
            testId="stat-card-total"
            index={0}
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6 text-chart-3" />}
            value={856}
            label={t('approved')}
            color="hsl(var(--chart-3))"
            testId="stat-card-approved"
            index={1}
          />
          <StatCard
            icon={<Clock className="w-6 h-6 text-chart-4" />}
            value={312}
            label={t('pending_review')}
            color="hsl(var(--chart-4))"
            testId="stat-card-pending"
            index={2}
          />
          <StatCard
            icon={<XCircle className="w-6 h-6 text-chart-5" />}
            value={79}
            label={t('rejected')}
            color="hsl(var(--chart-5))"
            testId="stat-card-rejected"
            index={3}
          />
        </div>
      </div>
    </section>
  );
}
