import React from 'react';
import { format, differenceInMonths, differenceInYears, differenceInDays } from 'date-fns';
import { User, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { MASTER_VACCINE_SCHEDULE } from '@/lib/vaccineSchedule';
import ShieldBadge from './ShieldBadge';
import { cn } from '@/lib/utils';

interface Child {
  _id?: string;
  id?: string;
  parentId: string | { _id: string; name: string; email: string; phone?: string };
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
  abhaId: string;
  schedule: any[];
  createdAt?: Date | string;
}

interface ChildCardProps {
  child: Child;
  onClick?: () => void;
  compact?: boolean;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onClick, compact }) => {
  const completedCount = child.schedule.filter((v) => v.status === 'COMPLETED').length;
  const overdueCount = child.schedule.filter((v) => v.status === 'OVERDUE').length;
  const pendingCount = child.schedule.filter((v) => v.status === 'PENDING').length;
  const totalCount = MASTER_VACCINE_SCHEDULE.length;

  const getAge = (dob: Date | string) => {
    const dobDate = dob instanceof Date ? dob : new Date(dob);
    const years = differenceInYears(new Date(), dobDate);
    if (years >= 1) return `${years} year${years > 1 ? 's' : ''} old`;

    const months = differenceInMonths(new Date(), dobDate);
    if (months >= 1) return `${months} month${months > 1 ? 's' : ''} old`;

    const days = differenceInDays(new Date(), dobDate);
    return `${days} day${days > 1 ? 's' : ''} old`;
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-slate-700 transition shadow-xs"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center border font-medium text-sm',
              child.gender === 'male'
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            )}
          >
            {child.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">{child.name}</h3>
            <p className="text-xs text-muted-foreground">{getAge(child.dateOfBirth)}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-slate-700 transition-all shadow-xs group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Child Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base border',
                child.gender === 'male'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              )}
            >
              {child.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-emerald-400 transition-colors">
                {child.name}
              </h3>
              <p className="text-xs text-muted-foreground">{getAge(child.dateOfBirth)}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="text-center p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xl font-bold text-emerald-400">{completedCount}</p>
              <p className="text-[11px] text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xl font-bold text-amber-400">{pendingCount}</p>
              <p className="text-[11px] text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <p className="text-xl font-bold text-rose-400">{overdueCount}</p>
              <p className="text-[11px] text-muted-foreground">Overdue</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span>DOB: {format(child.dateOfBirth, 'dd MMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span className="font-mono">ABHA: {child.abhaId.replace(/(\d{4})/g, '$1 ').trim()}</span>
            </div>
          </div>
        </div>

        {/* Shield Badge */}
        <div className="flex-shrink-0">
          <ShieldBadge
            completedCount={completedCount}
            totalCount={totalCount}
            size="md"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ChildCard;
