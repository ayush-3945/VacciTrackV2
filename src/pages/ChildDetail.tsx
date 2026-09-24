import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, Download, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import VaccineTimeline from '@/components/VaccineTimeline';
import ShieldBadge from '@/components/ShieldBadge';
import { useLanguage } from '@/context/LanguageContext';
import { childrenAPI } from '@/lib/api';
import { MASTER_VACCINE_SCHEDULE } from '@/lib/vaccineSchedule';
import { cn } from '@/lib/utils';
import CertificateModal from '@/components/CertificateModal';
import { toast } from 'sonner';

interface Child {
  _id?: string;
  id?: string;
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
  abhaId: string;
  schedule: any[];
}

const ChildDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [child, setChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const handleShare = async () => {
    if (!child) return;
    const verifyUrl = `${window.location.origin}/verify/${child.id || child._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${child.name} - VacciTrack Immunization Certificate`,
          text: `View and verify ${child.name}'s NIS 2025 immunization record on VacciTrack.`,
          url: verifyUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(verifyUrl);
    toast.success('Verification link copied to clipboard!');
  };

  useEffect(() => {
    const fetchChild = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const childData = await childrenAPI.getById(id);
        // Normalize child data
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
        setChild(normalizedChild);
      } catch (error: any) {
        console.error('Failed to load child:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChild();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading child details...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Child not found</h1>
          <button
            onClick={() => navigate('/parent')}
            className="btn-medical"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const completedCount = child.schedule.filter(v => v.status === 'COMPLETED').length;
  const totalCount = MASTER_VACCINE_SCHEDULE.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/parent')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 sm:p-7 mb-8 shadow-xs"
        >
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            {/* Child Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border',
                  child.gender === 'male' 
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                )}>
                  {child.name.charAt(0)}
                </div>
                <div>
                  <h1 className="font-display font-semibold text-2xl text-foreground">
                    {child.name}
                  </h1>
                  <p className="text-xs text-muted-foreground capitalize">{child.gender} • Pediatric Patient</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-muted-foreground/70" />
                  <span>Born: {format(child.dateOfBirth, 'dd MMMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-4 h-4 text-muted-foreground/70" />
                  <span className="font-mono text-xs">ABHA: {child.abhaId.replace(/(\d{4})/g, '$1 ').trim()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 mt-6">
                <button
                  onClick={() => setIsCertModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Certificate
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-medium transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Share Record
                </button>
              </div>
            </div>

            {/* Shield Badge */}
            <div className="flex-shrink-0">
              <ShieldBadge
                completedCount={completedCount}
                totalCount={totalCount}
                size="lg"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-4 text-center shadow-xs">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
              {child.schedule.filter(v => v.status === 'COMPLETED').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('completed')}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center shadow-xs">
            <p className="text-2xl sm:text-3xl font-bold text-amber-400">
              {child.schedule.filter(v => v.status === 'PENDING').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('pending')}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center shadow-xs">
            <p className="text-2xl sm:text-3xl font-bold text-rose-400">
              {child.schedule.filter(v => v.status === 'OVERDUE').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('overdue')}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center shadow-xs">
            <p className="text-2xl sm:text-3xl font-bold text-slate-400">
              {child.schedule.filter(v => v.status === 'UPCOMING').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('upcoming')}</p>
          </div>
        </motion.div>

        {/* Vaccine Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display font-semibold text-xl text-foreground mb-6">
            {t('vaccineTimeline')}
          </h2>
          <VaccineTimeline schedule={child.schedule} />
        </motion.div>
      </main>

      {child && (
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          child={{
            id: child.id || child._id || '',
            name: child.name,
            gender: child.gender,
            dateOfBirth: child.dateOfBirth,
            abhaId: child.abhaId,
            schedule: child.schedule,
          }}
        />
      )}
    </div>
  );
};

export default ChildDetail;
