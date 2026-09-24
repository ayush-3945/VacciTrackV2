import React from 'react';
import { Shield, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateShieldLevel } from '@/lib/vaccineSchedule';
import { cn } from '@/lib/utils';

interface ShieldBadgeProps {
  completedCount: number;
  totalCount: number;
  size?: 'sm' | 'md' | 'lg';
}

const ShieldBadge: React.FC<ShieldBadgeProps> = ({ completedCount, totalCount, size = 'md' }) => {
  const { level, title, progress } = calculateShieldLevel(completedCount);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const levelColors = [
    'from-slate-400 to-slate-600',
    'from-amber-400 to-amber-600',
    'from-emerald-400 to-teal-600',
    'from-blue-500 to-cyan-600',
    'from-purple-500 to-indigo-600',
    'from-emerald-400 via-teal-500 to-cyan-500',
  ];

  const levelGlows = [
    'bg-slate-400/20 shadow-slate-500/10',
    'bg-amber-500/30 shadow-amber-500/20',
    'bg-emerald-500/35 shadow-emerald-500/25',
    'bg-blue-500/35 shadow-blue-500/25',
    'bg-purple-500/40 shadow-purple-500/30',
    'bg-teal-400/45 shadow-teal-400/35',
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className={cn('relative flex items-center justify-center', sizeClasses[size])}
      >
        {/* Soft Radial Ambient Glow */}
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-lg opacity-60 transition-opacity',
            levelGlows[level]
          )}
        />

        {/* Shield Background Circle */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br shadow-xl border-2 border-white/20 dark:border-white/10 flex items-center justify-center',
            levelColors[level]
          )}
        />

        {/* Shield Icon */}
        <div className="relative z-10 flex items-center justify-center">
          <Shield className={cn(
            'text-white drop-shadow-md',
            size === 'sm' && 'w-8 h-8',
            size === 'md' && 'w-11 h-11',
            size === 'lg' && 'w-15 h-15'
          )} />
        </div>

        {/* Level Stars */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 z-20 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-xs border border-border/50 shadow-xs">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'transition-all',
                size === 'sm' && 'w-2 h-2',
                size === 'md' && 'w-2.5 h-2.5',
                size === 'lg' && 'w-3.5 h-3.5',
                i < level ? 'text-amber-400 fill-amber-400 drop-shadow' : 'text-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Continuous Pulse Glow for Active Levels */}
        {level > 0 && (
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className={cn('absolute inset-0 rounded-full blur-md pointer-events-none', levelGlows[level])}
          />
        )}
      </motion.div>

      {/* Title and Progress */}
      <div className="text-center mt-1">
        <p className={cn('font-display font-bold text-foreground tracking-tight', textSizes[size])}>
          {title}
        </p>
        <p className="text-[11px] font-medium text-muted-foreground">
          Level {level} • {completedCount}/{totalCount} vaccines
        </p>
      </div>
    </div>
  );
};

export default ShieldBadge;
