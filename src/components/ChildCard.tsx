import React from 'react';
import { format, differenceInMonths, differenceInYears, differenceInDays } from 'date-fns';
import { 
  User, 
  Calendar, 
  ChevronRight, 
  ArrowRight, 
  ArrowRightLeft, 
  Trash2, 
  Stethoscope,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  FileText
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
  compact = false 
}) => {
  const getAge = (dob: Date | string) => {
    const birthDate = new Date(dob);
    const now = new Date();
    const years = differenceInYears(now, birthDate);
    const months = differenceInMonths(now, birthDate) % 12;

    if (years === 0) {
      if (months === 0) {
        const days = differenceInDays(now, birthDate);
        return `${days} day${days !== 1 ? 's' : ''} old`;
      }
      return `${months} month${months !== 1 ? 's' : ''} old`;
    }
    return `${years} yr${years !== 1 ? 's' : ''} ${months > 0 ? `${months} mo` : ''}`.trim();
  };

  const schedule = child.schedule || [];
  const completedCount = schedule.filter(v => v.status === 'COMPLETED').length;
  const overdueCount = schedule.filter(v => v.status === 'OVERDUE').length;
  const pendingCount = schedule.filter(v => v.status === 'PENDING').length;
  const totalCount = MASTER_VACCINE_SCHEDULE.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Next upcoming or overdue vaccine for this specific child
  const nextChildVaccine = schedule
    .filter(v => v.status === 'PENDING' || v.status === 'OVERDUE')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const formattedDob = () => {
    try {
      return format(new Date(child.dateOfBirth), 'dd MMM yyyy');
    } catch (e) {
      return 'N/A';
    }
  };

  const formattedAbha = child.abhaId 
    ? child.abhaId.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')
    : 'Not Assigned';

  const doctorName = typeof child.doctorId === 'object' && child.doctorId !== null
    ? child.doctorId.name
    : 'PHC Medical Officer';

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className="p-4 rounded-xl border border-border bg-card hover:bg-card/90 cursor-pointer transition-colors shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground font-semibold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{child.name}</h4>
              <p className="text-xs text-muted-foreground">{getAge(child.dateOfBirth)}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card hover:bg-card/95 border border-border transition-colors rounded-2xl p-5 sm:p-6 relative flex flex-col justify-between shadow-xs"
    >
      <div>
        {/* Card Header: Avatar + Name + Age + Overdue Badge + Delete */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-secondary border border-border text-foreground flex items-center justify-center flex-shrink-0 relative shadow-2xs">
              <User className="w-6 h-6 text-muted-foreground" />
              <span className={cn(
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-card flex items-center justify-center text-[8px] font-bold text-white',
                child.gender === 'male' ? 'bg-blue-600' : 'bg-rose-500'
              )}>
                {child.gender === 'male' ? 'M' : 'F'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 
                  onClick={onClick}
                  className="font-display font-bold text-lg sm:text-xl text-foreground hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  {child.name}
                </h3>
              </div>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>{getAge(child.dateOfBirth)}</span>
                <span className="text-border">•</span>
                <span>NIS 2025 Schedule</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Overdue Warning Badge */}
            {overdueCount > 0 && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                title={`${overdueCount} vaccinations require immediate attention`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{overdueCount} Overdue</span>
              </div>
            )}

            {/* Delete Button */}
            {onDeleteChild && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChild(child);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Delete child record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* DOB & ABHA Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary border border-border shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">DOB:</span>
            <span className="font-semibold text-foreground">{formattedDob()}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary border border-border shadow-2xs font-mono">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">ABHA</span>
            <span className="font-semibold text-foreground tracking-wider">{formattedAbha}</span>
          </span>
        </div>

        {/* Middle Section: Elevated Stats & Shield Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-stretch mb-4">
          {/* Stats Chips & Progress Gauge (2 cols) */}
          <div className="sm:col-span-2 space-y-3 flex flex-col justify-between">
            {/* 3 Sleek Neutral Stat Counters */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Completed</span>
                </div>
                <p className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400 leading-tight">
                  {completedCount}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Pending</span>
                </div>
                <p className="text-xl font-bold font-display text-amber-600 dark:text-amber-400 leading-tight">
                  {pendingCount}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Overdue</span>
                </div>
                <p className="text-xl font-bold font-display text-rose-600 dark:text-rose-400 leading-tight">
                  {overdueCount}
                </p>
              </div>
            </div>

            {/* Dynamic Immunity Health Gauge */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Immunization Shield</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {progressPercent}% Protected
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  <strong className="text-foreground font-semibold">{completedCount}</strong> of {totalCount} Doses
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden p-0.5 border border-border shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Shield Tier Badge */}
          <div className="sm:col-span-1 flex">
            <ShieldBadge
              completedCount={completedCount}
              totalCount={totalCount}
              size="md"
              showContainer={true}
            />
          </div>
        </div>

        {/* Milestone Indicator: Next Dose for this Child */}
        {nextChildVaccine && (
          <div className={cn(
            "flex items-center justify-between text-xs px-3.5 py-2 rounded-xl border mb-3",
            nextChildVaccine.status === 'OVERDUE'
              ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
              : "bg-secondary border-border text-foreground"
          )}>
            <div className="flex items-center gap-1.5 truncate">
              {nextChildVaccine.status === 'OVERDUE' ? (
                <span className="font-semibold inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  Due Now:
                </span>
              ) : (
                <span className="font-semibold text-muted-foreground">Next Dose:</span>
              )}
              <span className="font-bold truncate">{nextChildVaccine.name}</span>
            </div>
            <span className="text-[11px] font-mono whitespace-nowrap opacity-80 font-medium">
              {format(new Date(nextChildVaccine.dueDate), 'dd MMM yyyy')}
            </span>
          </div>
        )}

        {/* Assigned Doctor & Transfer Row */}
        <div className="flex items-center justify-between gap-2 text-xs py-2 px-3 rounded-xl bg-secondary border border-border mb-4">
          <div className="flex items-center gap-2 truncate text-muted-foreground">
            <Stethoscope className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              Assigned Doctor:{' '}
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
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex-shrink-0"
            >
              <ArrowRightLeft className="w-3 h-3" />
              Transfer
            </button>
          )}
        </div>
      </div>

      {/* Prominent Bottom Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-border">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownloadCertificate?.(child);
          }}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border transition-colors shadow-2xs active:scale-[0.98]"
        >
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span>Download Certificate</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-xs active:scale-[0.98]"
        >
          <span>View Full Timeline</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ChildCard;
