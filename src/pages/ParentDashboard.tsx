import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Baby, 
  Trash2, 
  ArrowRightLeft, 
  ArrowRight,
  Search, 
  MapPin, 
  ExternalLink,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import Navbar from '@/components/Navbar';
import ChildCard from '@/components/ChildCard';
import StatsCard from '@/components/StatsCard';
import CertificateModal from '@/components/CertificateModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { childrenAPI, usersAPI } from '@/lib/api';
import { MASTER_VACCINE_SCHEDULE } from '@/lib/vaccineSchedule';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Child {
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

const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [childToTransfer, setChildToTransfer] = useState<Child | null>(null);
  const [transferDoctorId, setTransferDoctorId] = useState('');
  const [doctorPreview, setDoctorPreview] = useState<any | null>(null);
  const [isLookingUpDoctor, setIsLookingUpDoctor] = useState(false);
  const [isTransferringDoctor, setIsTransferringDoctor] = useState(false);
  const [selectedCertificateChild, setSelectedCertificateChild] = useState<any | null>(null);
  const [newChild, setNewChild] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
  });

  // Fetch children from API
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await childrenAPI.getAll();
        // Normalize children data
        const normalizedChildren = data.map((child: any) => ({
          ...child,
          id: child._id || child.id,
          dateOfBirth: new Date(child.dateOfBirth),
          schedule: child.schedule.map((v: any) => ({
            ...v,
            dueDate: new Date(v.dueDate),
            administeredDate: v.administeredDate ? new Date(v.administeredDate) : undefined,
          })),
        }));
        setChildren(normalizedChildren);
      } catch (error: any) {
        toast.error('Failed to load children', {
          description: error.message || 'An error occurred',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  // Calculate aggregate stats
  const totalStats = children.reduce(
    (acc, child) => {
      child.schedule.forEach(v => {
        if (v.status === 'COMPLETED') acc.completed++;
        else if (v.status === 'PENDING') acc.pending++;
        else if (v.status === 'OVERDUE') acc.overdue++;
        else acc.upcoming++;
      });
      return acc;
    },
    { completed: 0, pending: 0, overdue: 0, upcoming: 0 }
  );

  // Get next upcoming vaccine
  const getNextVaccine = () => {
    for (const child of children) {
      const pending = child.schedule
        .filter(v => v.status === 'PENDING' || v.status === 'UPCOMING')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      if (pending.length > 0) {
        return { child, vaccine: pending[0] };
      }
    }
    return null;
  };

  const nextVaccine = getNextVaccine();

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const childData = await childrenAPI.create({
        name: newChild.name,
        dateOfBirth: newChild.dateOfBirth,
        gender: newChild.gender,
      });

      // Normalize and add to local state
      const normalizedChild = {
        ...childData,
        id: childData._id || childData.id,
        dateOfBirth: new Date(childData.dateOfBirth),
        schedule: childData.schedule.map((v: any) => ({
          ...v,
          dueDate: new Date(v.dueDate),
          administeredDate: v.administeredDate ? new Date(v.administeredDate) : undefined,
        })),
      };
      setChildren([...children, normalizedChild]);

      toast.success('Child added successfully!', {
        description: `${newChild.name} has been registered with their vaccination schedule.`,
      });

      setNewChild({ name: '', dateOfBirth: '', gender: 'male' });
      setIsAddChildOpen(false);
    } catch (error: any) {
      toast.error('Failed to add child', {
        description: error.message || 'An error occurred',
      });
    }
  };

  const handleDeleteChild = async () => {
    if (!childToDelete) return;

    try {
      setIsDeleting(true);
      const childId = childToDelete.id || childToDelete._id;
      if (!childId) return;

      const result = await childrenAPI.remove(childId);

      // Remove child from local state
      setChildren((prev) => prev.filter((child) => child.id !== childId));
      setChildToDelete(null);

      // If parent account was deleted, logout and redirect
      if (result.parentDeleted) {
        toast.success('Child deleted', {
          description: 'Your account has been deleted as you have no remaining children.',
        });
        // Small delay to show the toast
        setTimeout(() => {
          logout();
          navigate('/');
        }, 2000);
      } else {
        toast.success('Child deleted', {
          description: `${childToDelete.name}'s record has been removed.`,
        });
      }
    } catch (error: any) {
      toast.error('Failed to delete child', {
        description: error.message || 'An error occurred',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetTransferState = () => {
    setTransferDoctorId('');
    setDoctorPreview(null);
    setIsLookingUpDoctor(false);
    setIsTransferringDoctor(false);
  };

  const openTransferDialog = (child: Child) => {
    setChildToTransfer(child);
    resetTransferState();
  };

  const handleLookupDoctor = async () => {
    const normalizedId = transferDoctorId.trim().toUpperCase();
    if (!/^DOC-[A-Z0-9]{6}$/.test(normalizedId)) {
      toast.error('Invalid Doctor ID format', {
        description: 'Use DOC-XXXXXX format (example: DOC-A3K9X2).',
      });
      return;
    }

    try {
      setIsLookingUpDoctor(true);
      const doctor = await usersAPI.lookupDoctor(normalizedId);
      setDoctorPreview(doctor);
      toast.success('Doctor found', {
        description: `${doctor.name}${doctor.hospitalName ? ` • ${doctor.hospitalName}` : ''}`,
      });
    } catch (error: any) {
      setDoctorPreview(null);
      toast.error('Doctor lookup failed', {
        description: error.message || 'Unable to find this doctor ID.',
      });
    } finally {
      setIsLookingUpDoctor(false);
    }
  };

  const handleTransferDoctor = async () => {
    if (!childToTransfer || !doctorPreview) return;
    const childId = childToTransfer.id || childToTransfer._id;
    if (!childId) return;

    try {
      setIsTransferringDoctor(true);
      const response = await childrenAPI.transferDoctor(childId, doctorPreview.doctorId);
      const updatedChildData = response.data;
      const normalizedChild = {
        ...updatedChildData,
        id: updatedChildData._id || updatedChildData.id,
        dateOfBirth: new Date(updatedChildData.dateOfBirth),
        schedule: updatedChildData.schedule.map((v: any) => ({
          ...v,
          dueDate: new Date(v.dueDate),
          administeredDate: v.administeredDate ? new Date(v.administeredDate) : undefined,
        })),
      };

      setChildren((prev) =>
        prev.map((child) =>
          (child.id || child._id) === childId ? normalizedChild : child
        )
      );

      toast.success('Doctor transferred successfully', {
        description: `${childToTransfer.name} is now assigned to Dr. ${doctorPreview.name}.`,
      });

      setChildToTransfer(null);
      resetTransferState();
    } catch (error: any) {
      toast.error('Transfer failed', {
        description: error.message || 'Unable to transfer doctor assignment.',
      });
    } finally {
      setIsTransferringDoctor(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Track and manage your children's immunization records
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title={t('completedVaccines')}
            value={totalStats.completed}
            icon={CheckCircle}
            variant="success"
            delay={0}
          />
          <StatsCard
            title={t('pendingVaccines')}
            value={totalStats.pending}
            subtitle="Due within 7 days"
            icon={Clock}
            variant="warning"
            delay={0.1}
          />
          <StatsCard
            title={t('missedVaccines')}
            value={totalStats.overdue}
            icon={AlertTriangle}
            variant="danger"
            delay={0.2}
          />
          <StatsCard
            title={t('upcomingVaccines')}
            value={totalStats.upcoming}
            icon={Calendar}
            delay={0.3}
          />
        </div>

        {/* Nearby Vaccination Centers Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base text-foreground font-display">
                  Find Government PHCs & Vaccine Centers Nearby
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white">
                  Live Map
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Discover nearby centers with live stock of NIS 2025 vaccines, walk-in timings & turn-by-turn directions
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/centers')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md hover:shadow-teal-500/25 transition-all whitespace-nowrap self-start sm:self-auto"
          >
            <span>Explore Centers Map 📍</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Next Vaccine Priority Alert Banner */}
        {nextVaccine && (() => {
          const daysDiff = differenceInDays(nextVaccine.vaccine.dueDate, new Date());
          const isOverdue = daysDiff < 0;
          const isDueToday = daysDiff === 0;

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className={cn(
                "mb-8 p-5 sm:p-6 rounded-3xl border backdrop-blur-xl transition-all shadow-md relative overflow-hidden",
                isOverdue
                  ? "bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30 hover:border-rose-500/50"
                  : "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 hover:border-amber-500/50"
              )}
            >
              {/* Soft Ambient Glow */}
              <div className={cn(
                "absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40",
                isOverdue ? "bg-rose-500/25" : "bg-amber-500/25"
              )} />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  {/* Pulsing Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md",
                    isOverdue
                      ? "bg-rose-500 text-white shadow-rose-500/20"
                      : "bg-amber-500 text-white shadow-amber-500/20"
                  )}>
                    {isOverdue ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Clock className="w-6 h-6" />}
                  </div>

                  <div>
                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border flex items-center gap-1.5",
                        isOverdue
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", isOverdue ? "bg-rose-500 animate-ping" : "bg-amber-500 animate-pulse")} />
                        {isOverdue ? "🚨 Critical Attention" : "⚡ Priority Action"}
                      </span>

                      {/* Clean Countdown Badge */}
                      <span className={cn(
                        "px-3 py-0.5 rounded-full text-xs font-bold border shadow-2xs",
                        isOverdue
                          ? "bg-rose-500 text-white border-rose-600"
                          : isDueToday
                            ? "bg-amber-500 text-white border-amber-600"
                            : "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40"
                      )}>
                        {isOverdue
                          ? `⚠️ ${Math.abs(daysDiff)} ${t('overdueDays')}`
                          : isDueToday
                            ? "🚨 Due Today!"
                            : `⏱️ ${daysDiff} ${t('daysRemaining')}`}
                      </span>
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-foreground font-display">
                      {t('nextVaccineDue')}: <span className="text-teal-600 dark:text-teal-400">{nextVaccine.vaccine.name}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      For <span className="font-semibold text-foreground">{nextVaccine.child.name}</span> • Due <span className="font-medium text-foreground">{format(nextVaccine.vaccine.dueDate, 'dd MMM yyyy')}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/child/${nextVaccine.child.id || nextVaccine.child._id}`)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-teal-500/25 transition-all whitespace-nowrap self-start sm:self-auto active:scale-[0.98]"
                >
                  <span>View Full Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })()}

        {/* Children Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-xl text-foreground">
              {t('children')}
            </h2>
            <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                  <Plus className="w-4 h-4" />
                  {t('addChild')}
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-primary" />
                    {t('addChild')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddChild} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('childName')}
                    </label>
                    <input
                      type="text"
                      value={newChild.name}
                      onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter child's name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('dateOfBirth')}
                    </label>
                    <input
                      type="date"
                      value={newChild.dateOfBirth}
                      onChange={(e) => setNewChild({ ...newChild, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('gender')}
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="male"
                          checked={newChild.gender === 'male'}
                          onChange={(e) => setNewChild({ ...newChild, gender: 'male' })}
                          className="w-4 h-4 text-primary"
                        />
                        <span>{t('male')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="female"
                          checked={newChild.gender === 'female'}
                          onChange={(e) => setNewChild({ ...newChild, gender: 'female' })}
                          className="w-4 h-4 text-primary"
                        />
                        <span>{t('female')}</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddChildOpen(false)}
                      className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-medical"
                    >
                      {t('save')}
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="card-medical p-12 text-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading children...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="card-medical p-12 text-center">
              <Baby className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">No children registered</h3>
              <p className="text-muted-foreground mb-6">Add your first child to start tracking vaccinations</p>
              <button
                onClick={() => setIsAddChildOpen(true)}
                className="btn-medical"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                {t('addChild')}
              </button>
            </div>
          ) : (
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {children.map((child) => (
                <motion.div
                  key={child.id || child._id}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                  }}
                >
                  <ChildCard
                    child={child}
                    onClick={() => navigate(`/child/${child.id || child._id}`)}
                    onDownloadCertificate={(c) => setSelectedCertificateChild(c)}
                    onTransferDoctor={(c) => openTransferDialog(c)}
                    onDeleteChild={(c) => setChildToDelete(c)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!childToDelete} onOpenChange={(open) => !open && setChildToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Child Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {childToDelete?.name}'s record? This action cannot be undone.
              {children.length === 1 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This is your only child. Deleting this record will also delete your account.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChild}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Doctor Dialog */}
      <Dialog
        open={!!childToTransfer}
        onOpenChange={(open) => {
          if (!open) {
            setChildToTransfer(null);
            resetTransferState();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Transfer Doctor - {childToTransfer?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Doctor ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transferDoctorId}
                  onChange={(e) => {
                    setTransferDoctorId(e.target.value.toUpperCase());
                    setDoctorPreview(null);
                  }}
                  placeholder="DOC-A3K9X2"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleLookupDoctor}
                  disabled={isLookingUpDoctor || !transferDoctorId.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-60"
                >
                  <Search className="w-4 h-4" />
                  {isLookingUpDoctor ? 'Checking...' : 'Preview'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Format: DOC-XXXXXX
              </p>
            </div>

            {doctorPreview && (
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Doctor Preview
                </p>
                <p className="font-semibold text-foreground">{doctorPreview.name}</p>
                <p className="text-sm text-muted-foreground">
                  {doctorPreview.hospitalName || 'Hospital not specified'}
                </p>
                <p className="text-xs font-mono mt-1">{doctorPreview.doctorId}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setChildToTransfer(null);
                  resetTransferState();
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferDoctor}
                disabled={!doctorPreview || isTransferringDoctor}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {isTransferringDoctor ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Certificate Preview & Download Modal */}
      {selectedCertificateChild && (
        <CertificateModal
          isOpen={!!selectedCertificateChild}
          onClose={() => setSelectedCertificateChild(null)}
          child={selectedCertificateChild}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
