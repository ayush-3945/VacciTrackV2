import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Clock, Plus, Baby, Trash2, ArrowRightLeft, Search, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ChildCard from '@/components/ChildCard';
import StatsCard from '@/components/StatsCard';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { childrenAPI, usersAPI } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [childToTransfer, setChildToTransfer] = useState<Child | null>(null);
  const [transferDoctorId, setTransferDoctorId] = useState('');
  const [doctorPreview, setDoctorPreview] = useState<any | null>(null);
  const [isLookingUpDoctor, setIsLookingUpDoctor] = useState(false);
  const [isTransferringDoctor, setIsTransferringDoctor] = useState(false);
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
      child.schedule.forEach((v) => {
        if (v.status === 'COMPLETED') acc.completed++;
        else if (v.status === 'PENDING') acc.pending++;
        else if (v.status === 'OVERDUE') acc.overdue++;
        else acc.upcoming++;
      });
      return acc;
    },
    { completed: 0, pending: 0, overdue: 0, upcoming: 0 }
  );

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const childData = await childrenAPI.create({
        name: newChild.name,
        dateOfBirth: newChild.dateOfBirth,
        gender: newChild.gender,
      });

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

      setChildren((prev) => prev.filter((child) => child.id !== childId));
      setChildToDelete(null);

      if (result.parentDeleted) {
        toast.success('Child deleted', {
          description: 'Your account has been deleted as you have no remaining children.',
        });
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

  const handleDeleteParentAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your parent account and all associated child vaccination records? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      setIsDeletingAccount(true);
      await usersAPI.deleteCurrentUser();

      toast.success('Account deleted', {
        description: 'Your parent account and records have been deleted successfully.',
      });

      logout();
      navigate('/');
    } catch (error: any) {
      toast.error('Failed to delete account', {
        description: error.message || 'An error occurred',
      });
    } finally {
      setIsDeletingAccount(false);
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-1">
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-sm text-muted-foreground">
                Track and manage your children's immunization records under NIS 2025
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/centers')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-medium transition shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>Find Centers</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteParentAccount}
                disabled={isDeletingAccount}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
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
            subtitle="Upcoming due doses"
            icon={Clock}
            variant="warning"
            delay={0.1}
          />
          <StatsCard
            title={t('overdueVaccines')}
            value={totalStats.overdue}
            subtitle="Requires immediate attention"
            icon={AlertTriangle}
            variant="danger"
            delay={0.2}
          />
          <StatsCard
            title="Children Registered"
            value={children.length}
            icon={Users}
            delay={0.3}
          />
        </div>

        {/* Children Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-foreground">
              {t('yourChildren')}
            </h2>

            {/* Add Child Dialog */}
            <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-xs transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addChild')}</span>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-card border border-border">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    <Baby className="w-5 h-5 text-emerald-500" />
                    {t('addChild')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddChild} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      {t('childName')}
                    </label>
                    <input
                      type="text"
                      value={newChild.name}
                      onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500"
                      placeholder="Enter child's full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      {t('dateOfBirth')}
                    </label>
                    <input
                      type="date"
                      value={newChild.dateOfBirth}
                      onChange={(e) => setNewChild({ ...newChild, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      {t('gender')}
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={newChild.gender === 'male'}
                          onChange={() => setNewChild({ ...newChild, gender: 'male' })}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span>{t('male')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={newChild.gender === 'female'}
                          onChange={() => setNewChild({ ...newChild, gender: 'female' })}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span>{t('female')}</span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-xs mt-4"
                  >
                    {t('save')}
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">Loading children...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Baby className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="font-semibold text-base text-foreground mb-1">No children registered</h3>
              <p className="text-xs text-muted-foreground mb-5">Add your first child to start tracking vaccinations</p>
              <button
                onClick={() => setIsAddChildOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {t('addChild')}
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {children.map((child) => (
                <div key={child.id || child._id} className="relative group">
                  <ChildCard
                    child={child}
                    onClick={() => navigate(`/child/${child.id || child._id}`)}
                  />
                  <div className="mt-2 px-1 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground truncate">
                      Assigned doctor:{' '}
                      <span className="font-medium text-foreground">
                        {typeof child.doctorId === 'object'
                          ? `${child.doctorId.name}${child.doctorId.doctorId ? ` (${child.doctorId.doctorId})` : ''}`
                          : 'Not assigned'}
                      </span>
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openTransferDialog(child);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-xs font-medium text-foreground transition"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                      Transfer Doctor
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChildToDelete(child);
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition hover:bg-destructive/20"
                    title="Delete child"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!childToDelete} onOpenChange={(open) => !open && setChildToDelete(null)}>
        <AlertDialogContent className="bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Child Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete {childToDelete?.name}'s record? This action cannot be undone.
              {children.length === 1 && (
                <span className="block mt-2 text-destructive font-medium text-xs">
                  Warning: This is your only child. Deleting this record will also delete your account.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-secondary text-foreground border border-border">
              Cancel
            </AlertDialogCancel>
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
        <DialogContent className="max-w-lg bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
              Transfer Doctor - {childToTransfer?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
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
                  className="flex-1 px-3.5 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleLookupDoctor}
                  disabled={isLookingUpDoctor || !transferDoctorId.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-medium text-foreground transition disabled:opacity-60"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isLookingUpDoctor ? 'Checking...' : 'Preview'}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Format: DOC-XXXXXX
              </p>
            </div>

            {doctorPreview && (
              <div className="rounded-lg border border-border p-3.5 bg-secondary/30">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                  Doctor Preview
                </p>
                <p className="font-semibold text-foreground text-sm">{doctorPreview.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doctorPreview.hospitalName || 'Hospital not specified'}
                </p>
                <p className="text-xs font-mono mt-1 text-emerald-400">{doctorPreview.doctorId}</p>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setChildToTransfer(null);
                  resetTransferState();
                }}
                className="flex-1 px-3.5 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferDoctor}
                disabled={!doctorPreview || isTransferringDoctor}
                className="flex-1 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition disabled:opacity-60 shadow-xs"
              >
                {isTransferringDoctor ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentDashboard;
