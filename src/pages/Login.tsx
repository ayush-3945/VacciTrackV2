import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Stethoscope, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Building2, 
  Phone, 
  Mail, 
  Lock, 
  BadgeCheck,
  Globe,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { authAPI } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

type PortalType = 'parent' | 'doctor' | null;
type FormMode = 'login' | 'register';

const Login: React.FC = () => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(null);
  const [formMode, setFormMode] = useState<FormMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regHospital, setRegHospital] = useState('');
  const [regSpecialization, setRegSpecialization] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registeredDoctorId, setRegisteredDoctorId] = useState('');
  
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Welcome back!', {
        description: 'You have successfully logged in.',
      });
      navigate(selectedPortal === 'doctor' ? '/doctor' : '/parent');
    } else {
      toast.error('Login failed', {
        description: result.error || 'Invalid credentials',
      });
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: 'doctor',
        phone: regPhone || undefined,
        hospitalName: regHospital || undefined,
        specialization: regSpecialization || undefined,
      });

      if (response.success) {
        const doctorId = response.data?.user?.doctorId;
        if (doctorId) {
          setRegisteredDoctorId(doctorId);
        }

        toast.success('Registration successful!', {
          description: `Your Doctor ID is: ${doctorId || 'Generated'}`,
          duration: 8000,
        });

        // Auto-login after registration
        const loginResult = await login(regEmail, regPassword);
        if (loginResult.success) {
          setTimeout(() => navigate('/doctor'), 1500);
        }
      }
    } catch (error: any) {
      toast.error('Registration failed', {
        description: error.message || 'An error occurred',
      });
    }

    setIsLoading(false);
  };

  const demoCredentials = {
    parent: { email: 'parent@demo.com', password: 'password123' },
    doctor: { email: 'doctor@aiims.com', password: 'password123' },
  };

  const fillDemoCredentials = () => {
    if (selectedPortal) {
      setEmail(demoCredentials[selectedPortal].email);
      setPassword(demoCredentials[selectedPortal].password);
    }
  };

  const resetForm = () => {
    setSelectedPortal(null);
    setFormMode('login');
    setEmail('');
    setPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhone('');
    setRegHospital('');
    setRegSpecialization('');
    setRegisteredDoctorId('');
  };

  const specializations = [
    'Pediatrics',
    'General Physician',
    'Family Medicine',
    'Neonatology',
    'Immunology',
    'Internal Medicine',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col justify-between selection:bg-emerald-500/20">
      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={resetForm}>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-lg tracking-tight text-foreground">
                Vacci<span className="text-emerald-500">Track</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-muted-foreground border border-border tracking-wide uppercase">
                NIS 2025
              </span>
            </div>
          </div>

          {/* Right Controls: Find Centers + Language + Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/centers')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 border border-border transition-all shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>Find Centers</span>
            </button>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-6 sm:py-8 relative z-10 w-full my-auto">
        <AnimatePresence mode="wait">
          {!selectedPortal ? (
            <motion.div
              key="portal-selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="w-full flex-1 flex flex-col justify-center items-center px-4"
            >
              {/* Hero Header */}
              <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
                {/* NIS 2025 Pill Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border mb-3.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>National Immunization Schedule (NIS) 2025 Compliant • ABHA Linked</span>
                </motion.div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-foreground mb-2 sm:mb-3">
                  Digital Immunization Management
                </h1>

                <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Authoritative healthcare portal for parents, guardians, and pediatric healthcare providers.
                </p>
              </div>

              {/* Side-by-Side Interactive Portal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto w-full mb-2">
                {/* Card 1: Parent & Guardian Portal */}
                <motion.div
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedPortal('parent')}
                  className="group relative p-6 sm:p-7 rounded-2xl bg-card hover:bg-card/90 border border-border hover:border-slate-700 shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground group-hover:text-emerald-400 transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                        For Families
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-1.5 group-hover:text-emerald-400 transition-colors">
                      Parent & Guardian Portal
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">
                      Track and safeguard your child's immunization journey with real-time digital protection.
                    </p>

                    {/* Feature Highlights */}
                    <ul className="space-y-2 mb-5 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Complete NIS 2025 Schedule (Birth to 16 Yrs)</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Instant QR Vaccine Certificate</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>24/7 AI Pediatric Guidance</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs sm:text-sm font-medium text-emerald-500 group-hover:text-emerald-400">
                    <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                      Enter Parent Portal →
                    </span>
                  </div>
                </motion.div>

                {/* Card 2: Doctor & Healthcare Provider Portal */}
                <motion.div
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedPortal('doctor')}
                  className="group relative p-6 sm:p-7 rounded-2xl bg-card hover:bg-card/90 border border-border hover:border-slate-700 shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground group-hover:text-emerald-400 transition-colors">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                        For Clinicians
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-1.5 group-hover:text-emerald-400 transition-colors">
                      Doctor & Clinic Portal
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">
                      Authorized pediatricians & government PHC staff verification and administration logs.
                    </p>

                    {/* Feature Highlights */}
                    <ul className="space-y-2 mb-5 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>OTP-Verified Administration</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>14-Digit ABHA ID Lookup</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Real-Time Cohort & Clinic Logs</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs sm:text-sm font-medium text-emerald-500 group-hover:text-emerald-400">
                    <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                      Enter Doctor Portal →
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`${selectedPortal}-${formMode}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md mx-auto px-4"
            >
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-lg">
                {/* Back Button */}
                <button
                  onClick={resetForm}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1.5 transition-colors group"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  Back to portal selection
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground">
                    {formMode === 'register' ? (
                      <UserPlus className="w-5 h-5 text-emerald-500" />
                    ) : selectedPortal === 'doctor' ? (
                      <Stethoscope className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Users className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground">
                      {formMode === 'register'
                        ? 'Register as Doctor'
                        : selectedPortal === 'doctor'
                          ? t('doctorPortal')
                          : t('parentPortal')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formMode === 'register'
                        ? 'Create your healthcare provider account'
                        : t('enterCredentials')}
                    </p>
                  </div>
                </div>

                {/* ─── LOGIN FORM ─── */}
                {formMode === 'login' && (
                  <>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('email')}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          placeholder="Enter your email"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('password')}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            placeholder="Enter your password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {t('login')}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-5 p-3.5 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Demo Credentials:</p>
                      <div className="text-xs font-mono text-foreground space-y-0.5">
                        <p>Email: {demoCredentials[selectedPortal].email}</p>
                        <p>Password: {demoCredentials[selectedPortal].password}</p>
                      </div>
                      <button
                        type="button"
                        onClick={fillDemoCredentials}
                        className="mt-2 text-xs text-emerald-400 hover:underline font-medium"
                      >
                        Click to autofill demo credentials
                      </button>
                    </div>

                    {/* Register CTA - only for doctors */}
                    {selectedPortal === 'doctor' && (
                      <div className="mt-4 pt-4 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground mb-2">New healthcare provider?</p>
                        <button
                          onClick={() => setFormMode('register')}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Register as Doctor
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* ─── REGISTRATION FORM ─── */}
                {formMode === 'register' && (
                  <>
                    {/* Success state with Doctor ID */}
                    {registeredDoctorId ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6 space-y-4"
                      >
                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <BadgeCheck className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Your unique Doctor ID:</p>
                          <p className="font-mono text-2xl font-bold tracking-wider text-emerald-400">
                            {registeredDoctorId}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Share this ID with patients so they can assign you as their doctor.
                          <br />Redirecting to dashboard...
                        </p>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleRegister} className="space-y-3">
                        {/* Name */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500"
                            placeholder="Dr. Jane Smith"
                            required
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500"
                              placeholder="doctor@hospital.com"
                              required
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Password *</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500"
                              placeholder="Min. 6 characters"
                              minLength={6}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Phone + Hospital row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <input
                                type="tel"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500"
                                placeholder="9876543210"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Hospital</label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <input
                                type="text"
                                value={regHospital}
                                onChange={(e) => setRegHospital(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500"
                                placeholder="AIIMS Delhi"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Specialization */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Specialization</label>
                          <select
                            value={regSpecialization}
                            onChange={(e) => setRegSpecialization(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500"
                          >
                            <option value="">Select specialization</option>
                            {specializations.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        {/* Submit */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              Create Doctor Account
                            </>
                          )}
                        </button>

                        {/* Back to login */}
                        <div className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => setFormMode('login')}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Already have an account? <span className="text-emerald-400">Login</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Trust & Compliance Strip */}
      <footer className="relative z-20 pb-4 pt-3 px-4 border-t border-border/60 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary/60 border border-border text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>25+ NIS Vaccines</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary/60 border border-border text-xs">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>OTP Verified</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary/60 border border-border text-xs">
            <BadgeCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>ABHA Integrated</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary/60 border border-border text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>English & हिन्दी</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
