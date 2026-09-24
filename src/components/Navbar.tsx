import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Globe, User, Menu, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationDropdown from '@/components/NotificationDropdown';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Official Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl text-foreground tracking-tight">
                VacciTrack
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                NIS 2025
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Find Centers Link */}
            <Link
              to="/centers"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-foreground bg-secondary/80 hover:bg-secondary border border-border/80 transition-colors shadow-2xs active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>Find Centers</span>
            </Link>

            {/* Theme Toggle */}
            <div className="p-0.5 rounded-full bg-secondary/80 border border-border/80 shadow-2xs">
              <ThemeToggle />
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-foreground bg-secondary/80 border border-border/80 hover:bg-secondary transition-colors shadow-2xs active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {user && <NotificationDropdown />}

            {user && (
              <>
                {/* User Info Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/80 shadow-2xs text-xs font-medium text-foreground">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-semibold">{user.name}</span>
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
                    user.role === 'doctor' 
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25' 
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  )}>
                    {user.role === 'doctor' ? 'Doctor' : 'Parent'}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border border-border/80 hover:border-rose-500/30 transition-all active:scale-95 shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-secondary/80 border border-border/80 text-foreground shadow-2xs hover:bg-muted"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/80 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2.5">
              <Link
                to="/centers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground bg-secondary/80 hover:bg-secondary border border-border/80"
              >
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Find Vaccination Centers</span>
              </Link>

              <div className="flex items-center gap-2">
                <ThemeToggle variant="with-label" className="flex-1 justify-start rounded-xl bg-secondary/80 border border-border/80" />
              </div>
              
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground bg-secondary/80 border border-border/80 hover:bg-muted"
              >
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
              </button>

              {user && (
                <>
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-secondary/80 border border-border/80 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{user.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
