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
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col justify-between selection:bg-teal-500/20">
      {/* Ambient Glowing Gradients & Dot Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle dot grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.10] dark:opacity-[0.16]" />
        
        {/* Soft Radial Ambient Glow Orbs */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-48 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={resetForm}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl tracking-tight text-foreground">
                Vacci<span className="text-teal-600 dark:text-teal-400">Track</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 uppercase tracking-wider">
                NIS 2025
              </span>
            </div>
          </div>

          {/* Right Controls: Find Centers + Language + Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/centers')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-all shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Find Centers 📍</span>
            </button>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border border-border/70 transition-colors"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-4 sm:py-6 relative z-10 w-full my-auto">
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
                {/* Glowing NIS 2025 Pill Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shadow-xs mb-3.5 backdrop-blur-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>🛡️ National Immunization Schedule (NIS) 2025 Compliant • ABHA Linked</span>
                </motion.div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-foreground mb-2 sm:mb-3">
                  Vacci<span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">Track</span>
                </h1>

                <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Shield Your Child's Future — India's Digital Immunization Management Platform
                </p>
              </div>

              {/* Side-by-Side Interactive Portal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto w-full mb-2">
                {/* Card 1: Parent & Guardian Portal */}
                <motion.div
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedPortal('parent')}
                  className="group relative p-5 sm:p-7 rounded-3xl bg-card/85 hover:bg-card border border-border/80 hover:border-emerald-500/60 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transition-all cursor-pointer flex flex-col justify-between overflow-hidden backdrop-blur-xl"
                >
                  {/* Top glowing gradient highlight */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all shadow-xs">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        For Families
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Parent & Guardian Portal
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
                      Track and safeguard your child's immunization journey with real-time digital protection.
                    </p>

                    {/* Feature Highlights */}
                    <ul className="space-y-2.5 mb-5 text-xs sm:text-sm text-muted-foreground">
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

                  <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                      Enter Parent Portal →
                    </span>
                  </div>
                </motion.div>

                {/* Card 2: Doctor & Healthcare Provider Portal */}
                <motion.div
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedPortal('doctor')}
                  className="group relative p-5 sm:p-7 rounded-3xl bg-card/85 hover:bg-card border border-border/80 hover:border-cyan-500/60 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transition-all cursor-pointer flex flex-col justify-between overflow-hidden backdrop-blur-xl"
                >
                  {/* Top glowing gradient highlight */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/25 transition-all shadow-xs">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        For Clinicians
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      Doctor & Clinic Portal
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
                      Authorized pediatricians & government PHC staff verification and administration logs.
                    </p>

                    {/* Feature Highlights */}
                    <ul className="space-y-2.5 mb-5 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                        <span>OTP-Verified Administration</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                        <span>14-Digit ABHA ID Lookup</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                        <span>Real-Time Cohort & Clinic Logs</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400">
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
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md mx-auto px-4"
            >
              <div className="card-medical p-6 sm:p-7 shadow-2xl border border-border/80 backdrop-blur-xl bg-card/95 rounded-3xl">
                {/* Back Button */}
                <button
                  onClick={resetForm}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1.5 transition-colors group"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  Back to portal selection
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                    selectedPortal === 'doctor' ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {formMode === 'register' ? (
                      <UserPlus className="w-6 h-6" />
                    ) : selectedPortal === 'doctor' ? (
                      <Stethoscope className="w-6 h-6" />
                    ) : (
                      <Users className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
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
                        className="w-full btn-medical flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          <>
                            {t('login')}
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
                      <div className="text-sm font-mono text-foreground">
                        <p>Email: {demoCredentials[selectedPortal].email}</p>
                        <p>Password: {demoCredentials[selectedPortal].password}</p>
                      </div>
                      <button
                        type="button"
                        onClick={fillDemoCredentials}
                        className="mt-2 text-xs text-primary hover:underline"
                      >
                        Click to fill demo credentials
                      </button>
                    </div>

                    {/* Register CTA - only for doctors */}
                    {selectedPortal === 'doctor' && (
                      <div className="mt-4 pt-4 border-t border-border text-center">
                        <p className="text-sm text-muted-foreground mb-2">New healthcare provider?</p>
                        <button
                          onClick={() => setFormMode('register')}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
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
                        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                          <BadgeCheck className="w-8 h-8 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Your unique Doctor ID:</p>
                          <p className="font-mono text-3xl font-bold tracking-wider text-primary">
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
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            placeholder="Dr. Jane Smith"
                            required
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                              placeholder="doctor@hospital.com"
                              required
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Password *</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                              placeholder="Min. 6 characters"
                              minLength={6}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Phone + Hospital row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type="tel"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                placeholder="9876543210"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Hospital</label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type="text"
                                value={regHospital}
                                onChange={(e) => setRegHospital(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
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
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
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
                          className="w-full btn-medical flex items-center justify-center gap-2 mt-2"
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-5 h-5" />
                              Create Doctor Account
                            </>
                          )}
                        </button>

                        {/* Back to login */}
                        <div className="text-center pt-2">
                          <button
                            type="button"
                            onClick={() => setFormMode('login')}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Already have an account? <span className="text-primary">Login</span>
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
      <footer className="relative z-20 pb-4 pt-3 px-4 border-t border-border/40 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 backdrop-blur-xs shadow-2xs hover:border-emerald-500/30 transition-colors">
            <span>🛡️</span>
            <span>25+ NIS Vaccines</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 backdrop-blur-xs shadow-2xs hover:border-teal-500/30 transition-colors">
            <span>🔐</span>
            <span>OTP Verified</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 backdrop-blur-xs shadow-2xs hover:border-cyan-500/30 transition-colors">
            <span>🪪</span>
            <span>ABHA Integrated</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 backdrop-blur-xs shadow-2xs hover:border-blue-500/30 transition-colors">
            <span>🌐</span>
            <span>English & हिन्दी</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
