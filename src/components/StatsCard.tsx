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
      bg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
      iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-teal-500/25',
      glow: 'group-hover:border-teal-500/50',
      topLine: 'from-teal-500 via-cyan-400 to-teal-500',
    },
    success: {
      bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25',
      glow: 'group-hover:border-emerald-500/50',
      topLine: 'from-emerald-500 via-teal-400 to-emerald-500',
    },
    warning: {
      bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25',
      glow: 'group-hover:border-amber-500/50',
      topLine: 'from-amber-500 via-orange-400 to-amber-500',
    },
    danger: {
      bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      iconBg: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25',
      glow: 'group-hover:border-rose-500/50',
      topLine: 'from-rose-500 via-red-400 to-rose-500',
    },
  };

  const v = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'group relative overflow-hidden backdrop-blur-xl bg-card/80 border border-border/70 hover:shadow-xl transition-all rounded-3xl p-5 flex flex-col justify-between',
        v.glow
      )}
    >
      {/* Top subtle glowing hairline */}
      <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50 group-hover:opacity-100 transition-opacity', v.topLine)} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
          <p className="text-3xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-[11px] font-medium text-muted-foreground mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 transition-transform group-hover:scale-110', v.iconBg)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
