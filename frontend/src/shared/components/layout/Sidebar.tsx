

import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Timer,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  GraduationCap,
  X,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Wallet,
  Activity,
  ShoppingCart,
  CheckCircle,
  FileText,
  Target,
} from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/shared/hooks/useTheme';
import { getInitials, getAvatarColor } from '@/shared/lib/utils';
import toast from 'react-hot-toast';

// ── Navegació ─────────────────────────────────────────────────────────────────
const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Tauler',        group: 'principal' },
  { to: '/assignatures',   icon: BookOpen,         label: 'Estudis',       group: 'estudis' },
  { to: '/tasques',        icon: CheckSquare,      label: 'Tasques',       group: 'estudis' },
  { to: '/pomodoro',       icon: Timer,            label: 'Pomodoro',      group: 'estudis' },
  { to: '/calendari',      icon: Calendar,         label: 'Calendari',     group: 'estudis' },
  { to: '/finances',       icon: Wallet,           label: 'Finances',      group: 'personal' },
  { to: '/habits',         icon: CheckCircle,      label: 'Hàbits',        group: 'personal' },
  { to: '/compres',        icon: ShoppingCart,     label: 'Compres',       group: 'personal' },
  { to: '/salut',          icon: Activity,         label: 'Salut',         group: 'personal' },
  { to: '/documents',      icon: FileText,         label: 'Documents',     group: 'personal' },
  { to: '/objectius',      icon: Target,           label: 'Objectius',     group: 'personal' },
  { to: '/estadistiques',  icon: BarChart3,        label: 'Estadístiques', group: 'analisi' },
  { to: '/configuracio',   icon: Settings,         label: 'Configuració',  group: 'compte' },
];

const groups = [
  { key: 'principal', label: 'Principal' },
  { key: 'estudis',   label: 'Estudis i Tasques' },
  { key: 'personal',  label: 'Personal i Llar' },
  { key: 'analisi',   label: 'Anàlisi' },
  { key: 'compte',    label: 'Compte' },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await logout();
      toast.success('Sessió tancada correctament');
    } catch {
      toast.error('Error al tancar la sessió');
    }
  };

  const sidebarContent = (
    <div className={cn(
      'flex flex-col h-full bg-[var(--bg-raised)] border-r border-[var(--border-subtle)]',
      'sidebar-transition overflow-hidden',
      collapsed ? 'w-[72px]' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_oklch(58%_var(--brand-chroma)_var(--brand-hue)_/_0.4)]">
            <GraduationCap size={18} className="text-white" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <span className="font-display font-bold text-base text-gradient whitespace-nowrap">
                  LifeHub
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onToggle}
          className={cn(
            'hidden lg:flex w-7 h-7 rounded-lg items-center justify-center',
            'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            'hover:bg-[var(--bg-elevated)] transition-all duration-150',
            collapsed && 'rotate-180'
          )}
          aria-label={collapsed ? 'Expandir sidebar' : 'Col·lapsar sidebar'}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Navegació */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group.key);
          return (
            <div key={group.key} className="mb-1">
              {!collapsed && (
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  {group.label}
                </p>
              )}
              {items.map((item) => {
                const isActive = location.pathname === item.to;
                
                // Mostrar el curs s'ha eliminat a petició del client
                const displayLabel = item.label;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5',
                      'text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-brand-500/12 text-brand-500'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                      collapsed && 'justify-center'
                    )}
                  >
                    {/* Indicador actiu */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-500" />
                    )}

                    <item.icon
                      size={18}
                      className={cn(
                        'flex-shrink-0',
                        isActive ? 'text-brand-500' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'
                      )}
                    />

                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {displayLabel}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Perfil usuari */}
      <div className={cn(
        'border-t border-[var(--border-subtle)] p-3 flex-shrink-0',
        collapsed ? 'flex justify-center' : ''
      )}>
        <div className={cn(
          'flex items-center gap-3 px-2 py-2 rounded-xl justify-between',
          collapsed && 'justify-center'
        )}>
          <div className="flex items-center gap-3 min-w-0">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt="Avatar"
                className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: getAvatarColor(userProfile?.displayName || 'U') }}
              >
                {getInitials(userProfile?.displayName || 'U')}
              </div>
            )}
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden min-w-0 flex-1"
                >
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {userProfile?.displayName ? userProfile.displayName.split(' ').slice(0, 2).join(' ') : ''}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {userProfile?.university ? `${userProfile.university} — ${userProfile.currentCourse || 'DAW1'}` : (userProfile?.currentCourse || 'DAW1')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!collapsed && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  const themes = ['light', 'dark', 'system'] as const;
                  const current = themes.indexOf(theme);
                  setTheme(themes[(current + 1) % themes.length]);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                title={`Tema actual: ${theme}`}
                aria-label="Canviar tema"
              >
                {theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />}
              </button>

              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[oklch(65%_0.25_25_/_0.1)] hover:text-[oklch(55%_0.25_25)] transition-all cursor-pointer"
                title="Tancar sessió"
                aria-label="Tancar sessió"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile sidebar (drawer) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
            >
              <div className="relative">
                <button
                  onClick={onMobileClose}
                  className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] z-10"
                >
                  <X size={14} />
                </button>
                {sidebarContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
