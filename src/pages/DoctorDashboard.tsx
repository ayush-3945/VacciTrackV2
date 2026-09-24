import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Syringe, CheckCircle, AlertTriangle, Clock, Building2, Pencil, Trash2, Phone, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import ChildCard from '@/components/ChildCard';
import StatsCard from '@/components/StatsCard';
import VaccineTimeline from '@/components/VaccineTimeline';
import ConfettiExplosion from '@/components/ConfettiExplosion';
import AddChildForm from '@/components/AddChildForm';
import OtpVerificationDialog from '@/components/OtpVerificationDialog';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { childrenAPI, usersAPI, notificationsAPI } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Child {
  _id?: string;
  id?: string;
  parentId: string | { _id: string; name: string; email: string; phone?: string };
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
  abhaId: string;
  parentPhone?: string;
  schedule: any[];
  createdAt?: Date | string;
}

const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
  });

  // OTP verification state
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState<{ vaccineId: string; vaccineName: string } | null>(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const handleSendReminder = async () => {
    if (!selectedChild) return;
    try {
      setIsSendingReminder(true);
      const childId = selectedChild.id || selectedChild._id;
      await notificationsAPI.sendDoctorReminder(childId);
      toast.success('Immunization Reminder Sent!', {
        description: `Notification & SMS alert dispatched to parent for ${selectedChild.name}.`,
      });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to send reminder', {
        description: err.message || 'Server error',
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Fetch all children from API
  useEffect(() => {
    const fetchChildren = async () => {
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
        setAllChildren(normalizedChildren);
      } catch (error: any) {
        toast.error('Failed to load children', {
          description: error.message || 'An error occurred',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, []);

  // Search children
  useEffect(() => {
    const searchChildren = async () => {
      if (!searchQuery.trim()) {
        // If search is empty, fetch all
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
        setAllChildren(normalizedChildren);
        return;
      }

      try {
        setIsLoading(true);
        const data = await childrenAPI.search(searchQuery);
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
        setAllChildren(normalizedChildren);
      } catch (error: any) {
        toast.error('Search failed', {
          description: error.message || 'An error occurred',
        });
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchChildren, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Filter by search (client-side filtering for instant feedback)
  const filteredChildren = searchQuery
    ? allChildren.filter((child) =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.abhaId.includes(searchQuery)
      )
    : allChildren;

  const handleChildRegistered = async () => {
    // Refresh the child list
    try {
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
      setAllChildren(normalizedChildren);
      setShowConfetti(true);
    } catch (error: any) {
      toast.error('Failed to refresh children', {
        description: error.message || 'An error occurred',
      });
    }
  };

  // Calculate aggregate stats
  const totalStats = allChildren.reduce(
    (acc, child) => {
      child.schedule.forEach(v => {
        if (v.status === 'COMPLETED') acc.completed++;
        else if (v.status === 'PENDING') acc.pending++;
        else if (v.status === 'OVERDUE') acc.overdue++;
      });
      return acc;
    },
    { completed: 0, pending: 0, overdue: 0 }
  );

  // Initiate OTP flow when doctor clicks "Administer"
  const handleAdminister = (vaccineId: string, vaccineName: string) => {
    if (!selectedChild) return;
    setOtpTarget({ vaccineId, vaccineName });
    setOtpDialogOpen(true);
  };

  // Called when OTP verification succeeds
  const handleOtpVerified = (updatedChildData: any) => {
    if (!selectedChild) return;

    const childId = selectedChild.id || selectedChild._id;

    // Normalize updated child data
    const updatedChild: Child = {
      ...updatedChildData,
      id: updatedChildData._id || updatedChildData.id,
      dateOfBirth: new Date(updatedChildData.dateOfBirth),
      schedule: updatedChildData.schedule.map((v: any) => ({
        ...v,
        dueDate: new Date(v.dueDate),
        administeredDate: v.administeredDate ? new Date(v.administeredDate) : undefined,
      })),
    };

    setSelectedChild(updatedChild);

    // Update in allChildren array
    setAllChildren((prev) =>
      prev.map((child) => (child.id === childId ? updatedChild : child))
    );

    // Show confetti
    setShowConfetti(true);

    toast.success(t('congratulations'), {
      description: t('vaccineCompleted'),
    });

    // Clean up OTP state
    setOtpTarget(null);
  };

  // Sync edit form when a child is selected
  React.useEffect(() => {
    if (selectedChild) {
      setEditForm({
        name: selectedChild.name,
        dateOfBirth: new Date(selectedChild.dateOfBirth).toISOString().split('T')[0],
        gender: selectedChild.gender,
      });
      setIsEditing(false);
    }
  }, [selectedChild]);

  const handleUpdateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;

    try {
      setIsSaving(true);
      const childId = selectedChild.id || selectedChild._id;
      if (!childId) return;

      const updatedChildData = await childrenAPI.update(childId, {
        name: editForm.name,
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
      });

      const updatedChild: Child = {
        ...updatedChildData,
        id: updatedChildData._id || updatedChildData.id,
        dateOfBirth: new Date(updatedChildData.dateOfBirth),
        schedule: updatedChildData.schedule.map((v: any) => ({
          ...v,
          dueDate: new Date(v.dueDate),
          administeredDate: v.administeredDate ? new Date(v.administeredDate) : undefined,
        })),
      };

      setSelectedChild(updatedChild);
      setAllChildren((prev) =>
        prev.map((child) => (child.id === childId ? updatedChild : child))
      );

      setIsEditing(false);

      toast.success('Child details updated', {
        description: `${updatedChild.name}'s profile has been updated.`,
      });
    } catch (error: any) {
      toast.error('Failed to update child', {
        description: error.message || 'An error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChild = async () => {
    if (!selectedChild) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the record for ${selectedChild.name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const childId = selectedChild.id || selectedChild._id;
      if (!childId) return;

      const result = await childrenAPI.remove(childId);

      setAllChildren((prev) => prev.filter((child) => child.id !== childId));
      setSelectedChild(null);

      if (result.parentDeleted) {
        toast.success('Child deleted', {
          description: 'The patient record has been removed. The parent account has also been deleted as it had no remaining children.',
        });
      } else {
        toast.success('Child deleted', {
          description: 'The patient record has been removed from your panel.',
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

  const handleDeleteDoctorAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your doctor account? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      setIsDeletingAccount(true);
      await usersAPI.deleteCurrentUser();

      toast.success('Account deleted', {
        description: 'Your doctor account has been deleted successfully.',
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

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-emerald-500/20">
      <Navbar />
      <ConfettiExplosion trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Authorized Pediatric Healthcare Provider Session</span>
              </div>
              <h1 className="font-display font-semibold text-2xl sm:text-3xl text-foreground tracking-tight">
                Doctor & Clinic Portal
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteDoctorAccount}
                disabled={isDeletingAccount}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                {isDeletingAccount ? 'Deleting account...' : 'Delete Doctor'}
              </button>
              <AddChildForm onSuccess={handleChildRegistered} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground/70" />
            <span>{user?.hospitalName || 'Healthcare Facility'}</span>
          </div>
          {user?.doctorId && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-md border border-border bg-secondary/40">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Doctor ID</span>
              <span className="font-mono text-xs font-semibold text-foreground">{user.doctorId}</span>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Patients"
            value={allChildren.length}
            icon={Users}
            delay={0}
          />
          <StatsCard
            title="Vaccines Given"
            value={totalStats.completed}
            icon={CheckCircle}
            variant="success"
            delay={0.1}
          />
          <StatsCard
            title="Pending Today"
            value={totalStats.pending}
            icon={Clock}
            variant="warning"
            delay={0.2}
          />
          <StatsCard
            title="Overdue Cases"
            value={totalStats.overdue}
            icon={AlertTriangle}
            variant="danger"
            delay={0.3}
          />
        </div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                placeholder="Search patient by child name or ABHA ID..."
              />
            </div>
          </div>
        </motion.div>

        {/* Patient List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-foreground">
              {searchQuery ? `Search Results (${filteredChildren.length})` : t('patientList')}
            </h2>
            <span className="text-xs text-muted-foreground">{filteredChildren.length} registered</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChildren.map((child) => (
              <motion.div
                key={child.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedChild(child)}
                className="bg-card border border-border hover:border-slate-700/80 rounded-xl p-4 cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-medium text-sm border ${
                    child.gender === 'male' 
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-emerald-400 transition-colors truncate">{child.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      ABHA: {child.abhaId.substring(0, 4)}...{child.abhaId.substring(10)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      DOB: {format(child.dateOfBirth, 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs">
                      <span className="text-emerald-400 font-semibold">{child.schedule.filter(v => v.status === 'COMPLETED').length}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">{child.schedule.length}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">completed</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-base font-semibold text-emerald-400">
                      {child.schedule.filter(v => v.status === 'COMPLETED').length}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-amber-400">
                      {child.schedule.filter(v => v.status === 'PENDING').length}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-rose-400">
                      {child.schedule.filter(v => v.status === 'OVERDUE').length}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Patient Detail Modal */}
      <Dialog open={!!selectedChild} onOpenChange={() => setSelectedChild(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-foreground">
              <Syringe className="w-5 h-5 text-emerald-500" />
              Patient Record: {selectedChild?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedChild && (
            <div className="mt-4">
              {/* Patient Info */}
              <div className="bg-secondary/40 border border-border rounded-xl p-4 mb-6 space-y-4">
                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleSendReminder}
                      disabled={isSendingReminder}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition disabled:opacity-60 shadow-xs"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {isSendingReminder ? 'Sending...' : 'Send Reminder'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing((prev) => !prev)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-medium transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {isEditing ? 'Cancel edit' : 'Edit details'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteChild}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition disabled:opacity-60"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isDeleting ? 'Deleting...' : 'Delete patient'}
                    </button>
                  </div>
                </div>

                {/* Details / Edit form */}
                {isEditing ? (
                  <form onSubmit={handleUpdateChild} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Name</p>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">DOB</p>
                      <input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Gender</p>
                      <div className="flex gap-3 mt-1">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            value="male"
                            checked={editForm.gender === 'male'}
                            onChange={() => setEditForm({ ...editForm, gender: 'male' })}
                            className="w-4 h-4 text-primary"
                          />
                          <span>Male</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            value="female"
                            checked={editForm.gender === 'female'}
                            onChange={() => setEditForm({ ...editForm, gender: 'female' })}
                            className="w-4 h-4 text-primary"
                          />
                          <span>Female</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1 flex flex-col justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs">ABHA ID</p>
                        <p className="font-mono text-xs break-all mt-1">{selectedChild.abhaId}</p>
                      </div>
                      <div className="flex justify-end mt-3 md:mt-0">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                        >
                          {isSaving ? 'Saving...' : 'Save changes'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-semibold">{selectedChild.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">DOB</p>
                      <p className="font-semibold">
                        {format(selectedChild.dateOfBirth, 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-semibold capitalize">{selectedChild.gender}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ABHA ID</p>
                      <p className="font-mono text-xs">{selectedChild.abhaId}</p>
                    </div>
                  </div>
                )}

                {/* Parent Phone Display */}
                <div className="flex items-center gap-2 pt-3 border-t border-border mt-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Parent Phone:</span>
                  {selectedChild.parentPhone || (typeof selectedChild.parentId === 'object' && selectedChild.parentId.phone) ? (
                    <span className="text-sm font-medium font-mono">
                      {selectedChild.parentPhone || (typeof selectedChild.parentId === 'object' ? selectedChild.parentId.phone : '')}
                    </span>
                  ) : (
                    <span className="text-sm text-warning">Not set — required for OTP verification</span>
                  )}
                </div>
              </div>

              {/* Vaccination Timeline */}
              <h3 className="font-semibold text-lg mb-4">{t('vaccineTimeline')}</h3>
              <VaccineTimeline
                schedule={selectedChild.schedule}
                onAdminister={handleAdminister}
                isDoctor={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      {selectedChild && otpTarget && (
        <OtpVerificationDialog
          open={otpDialogOpen}
          onOpenChange={setOtpDialogOpen}
          childId={selectedChild.id || selectedChild._id || ''}
          vaccineId={otpTarget.vaccineId}
          vaccineName={otpTarget.vaccineName}
          childName={selectedChild.name}
          onVerified={handleOtpVerified}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
