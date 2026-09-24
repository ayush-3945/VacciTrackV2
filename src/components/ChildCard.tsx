import React from 'react';
import { format, differenceInMonths, differenceInYears, differenceInDays } from 'date-fns';
import { 
  User, 
  Calendar, 
  CreditCard, 
  ChevronRight, 
  ArrowRight, 
  ArrowRightLeft, 
  Trash2, 
  Stethoscope,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MASTER_VACCINE_SCHEDULE } from '@/lib/vaccineSchedule';
import ShieldBadge from './ShieldBadge';
import { cn } from '@/lib/utils';

export interface Child {
  _id?: string;
  id?: string;
  parentId: string | { _id: string; name: string; email: string; phone?: string };
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
  abhaId: string;
  doctorId?: string | { _id: string; name: string; doctorId?: string; hospitalName?: string; specialization?: string };
  schedule: any[];
  createdAt?: Date | string;
}

interface ChildCardProps {
  child: Child;
  onClick?: () => void;
  onDownloadCertificate?: (child: Child) => void;
  onTransferDoctor?: (child: Child) => void;
  onDeleteChild?: (child: Child) => void;
  compact?: boolean;
}

const ChildCard: React.FC<ChildCardProps> = ({ 
  child, 
  onClick, 
  onDownloadCertificate, 
  onTransferDoctor, 
  onDeleteChild, 
  compact 
}) => {
  const schedule = child.schedule || [];
  const completedCount = schedule.filter(v => v.status === 'COMPLETED').length;
  const overdueCount = schedule.filter(v => v.status === 'OVERDUE').length;
  const pendingCount = schedule.filter(v => v.status === 'PENDING').length;
  const totalCount = MASTER_VACCINE_SCHEDULE.length; // 26 doses in NIS 2025
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  const getAge = (dob: Date | string) => {
    const dobDate = dob instanceof Date ? dob : new Date(dob);
    if (isNaN(dobDate.getTime())) return '';
    const years = differenceInYears(new Date(), dobDate);
    if (years >= 1) return `${years} year${years > 1 ? 's' : ''} old`;
    
    const months = differenceInMonths(new Date(), dobDate);
    if (months >= 1) return `${months} month${months > 1 ? 's' : ''} old`;
    
    const days = differenceInDays(new Date(), dobDate);
    return `${days} day${days > 1 ? 's' : ''} old`;
  };

  const formattedDob = () => {
    try {
      const dobDate = child.dateOfBirth instanceof Date ? child.dateOfBirth : new Date(child.dateOfBirth);
      return !isNaN(dobDate.getTime()) ? format(dobDate, 'dd MMM yyyy') : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const formattedAbha = child.abhaId
    ? child.abhaId.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim()
    : 'N/A';

  const doctorName = typeof child.doctorId === 'object' && child.doctorId
    ? child.doctorId.name
    : 'Not assigned';

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="backdrop-blur-md bg-card/70 border border-border/60 hover:border-emerald-500/40 hover:shadow-lg transition-all rounded-2xl p-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-xs',
            child.gender === 'male' 
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          )}>
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{child.name}</h3>
            <p className="text-xs text-muted-foreground">{getAge(child.dateOfBirth)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="backdrop-blur-md bg-card/70 border border-border/60 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all rounded-3xl p-5 sm:p-6 relative overflow-hidden group flex flex-col justify-between"
    >
      {/* Top subtle gradient hairline */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-13 h-13 rounded-2xl flex items-center justify-center shadow-xs border flex-shrink-0',
              child.gender === 'male'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                : 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30'
            )}>
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 
                  onClick={onClick}
                  className="font-display font-bold text-xl text-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {child.name}
                </h3>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {getAge(child.dateOfBirth)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Overdue Warning Badge */}
            {overdueCount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs"
                title={`${overdueCount} vaccinations require immediate attention`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>⚠️ {overdueCount} Overdue</span>
              </motion.div>
            )}

            {/* Delete Button */}
            {onDeleteChild && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChild(child);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100"
                title="Delete child record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* DOB & ABHA Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/50">
            <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>DOB: {formattedDob()}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/50 font-mono">
            <CreditCard className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>ABHA: {formattedAbha}</span>
          </span>
        </div>

        {/* Middle Section: Stats & Shield */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
          {/* Stats Chips (2 cols) */}
          <div className="sm:col-span-2 space-y-3">
            {/* 3 Sleek Pill Counters */}
            <div className="grid grid-cols-3 gap-2">
              <div className="px-2.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 leading-tight">
                  {completedCount}
                </p>
                <p className="text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-400/80 uppercase tracking-wider">
                  Completed
                </p>
              </div>
              <div className="px-2.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 leading-tight">
                  {pendingCount}
                </p>
                <p className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-400/80 uppercase tracking-wider">
                  Pending
                </p>
              </div>
              <div className="px-2.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 leading-tight">
                  {overdueCount}
                </p>
                <p className="text-[10px] font-semibold text-rose-700/80 dark:text-rose-400/80 uppercase tracking-wider">
                  Overdue
                </p>
              </div>
            </div>

            {/* Dynamic Immunity Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Immunity Protection
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  {progressPercent}% Protected • {completedCount} of {totalCount} Doses
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted/80 rounded-full overflow-hidden p-0.5 border border-border/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Shield Badge (1 col) */}
          <div className="flex justify-center sm:justify-end">
            <ShieldBadge
              completedCount={completedCount}
              totalCount={totalCount}
              size="md"
            />
          </div>
        </div>

        {/* Assigned Doctor & Transfer Row */}
        <div className="flex items-center justify-between gap-2 text-xs py-2 px-3 rounded-xl bg-muted/40 border border-border/40 mb-4">
          <div className="flex items-center gap-2 truncate text-muted-foreground">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className="truncate">
              Doctor:{' '}
              <span className="font-semibold text-foreground">
                {doctorName}
              </span>
            </span>
          </div>
          {onTransferDoctor && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTransferDoctor(child);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline flex-shrink-0 transition-colors"
            >
              <ArrowRightLeft className="w-3 h-3" />
              Transfer
            </button>
          )}
        </div>
      </div>

      {/* Prominent Bottom Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-border/60">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownloadCertificate?.(child);
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground bg-muted hover:bg-muted/80 border border-border/70 hover:border-emerald-500/30 transition-all shadow-2xs active:scale-[0.98]"
        >
          <span>📜</span>
          <span>Download Certificate</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md hover:shadow-teal-500/20 active:scale-[0.98]"
        >
          <span>View Full Timeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

export default ChildCard;
