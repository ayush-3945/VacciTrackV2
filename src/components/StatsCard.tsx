import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  delay = 0,
}) => {
  const variants = {
    default: {
      iconContainer: 'bg-secondary text-muted-foreground border-border/80',
    },
    success: {
      iconContainer: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      iconContainer: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    danger: {
      iconContainer: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    },
  };

  const v = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="bg-card hover:bg-card/95 border border-border rounded-2xl p-5 flex flex-col justify-between transition-colors shadow-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
          <p className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-[11px] font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform shadow-2xs', v.iconContainer)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
