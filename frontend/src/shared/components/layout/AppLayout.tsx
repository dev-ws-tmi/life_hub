import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFirestoreSync } from '@/shared/hooks/useFirestoreSync';
import { useTheme } from '@/shared/hooks/useTheme';
import { usePageTitle } from '@/shared/hooks/usePageTitle';

export type TimeScope = 'AVUI' | 'SETMANA' | 'MES' | 'ANY';

// ── Títols de pàgina per ruta ─────────────────────────────────────────────────
const pageTitles: Record<string, string> = {
  '/dashboard':      'Tauler',
  '/assignatures':   'Assignatures',
  '/tasques':        'Tasques',
  '/pomodoro':       'Pomodoro',
  '/calendari':      'Calendari',
  '/estadistiques':  'Estadístiques',
  '/configuracio':   'Configuració',
};

// ── App Layout ─────────────────────────────────────────────────────────────────
export function AppLayout() {
  // Activa la sincronització amb Firestore
  useFirestoreSync();
  // Actualitza el títol de la pestanya del navegador en cada canvi de ruta
  usePageTitle();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timeScope, setTimeScope] = useState<TimeScope>('SETMANA');
  const { userProfile } = useAuth();
  const location = useLocation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'Bon dia';
    if (hour >= 14 && hour < 21) return 'Bona tarda';
    return 'Bona nit';
  };

  const pageTitle = location.pathname === '/dashboard'
    ? `${getGreeting()}, ${userProfile?.displayName || 'Marcel Cayuela Dolcet'}`
    : (pageTitles[location.pathname] || 'Estudi360');

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg-base)]">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-4 lg:p-6 animate-fade-in flex flex-col gap-6">
            
            {/* Header Row */}
            <div className={`flex items-center justify-between ${location.pathname !== '/dashboard' ? 'lg:hidden' : ''}`}>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                aria-label="Obrir menú"
              >
                <Menu size={20} />
              </button>

              <div className={location.pathname === '/dashboard' ? 'block' : 'hidden lg:block'}>
                <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
                  {pageTitle}
                </h1>
                {(userProfile?.university || userProfile?.degree || userProfile?.currentCourse) && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                    {userProfile.university || 'Estudiant'}
                    {(userProfile.degree || userProfile.currentCourse) && ` · ${userProfile.degree || userProfile.currentCourse}`}
                  </p>
                )}
              </div>

              {/* Actions (Time Scope Selector on Dashboard) */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {location.pathname === '/dashboard' && (
                  <div className="flex items-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-1 gap-0.5">
                    {(['AVUI', 'SETMANA', 'MES', 'ANY'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setTimeScope(s)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
                          ${timeScope === s
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)]'
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Page content */}
            <div className="flex-1">
              <Outlet context={{ timeScope, setTimeScope }} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Auth Layout ────────────────────────────────────────────────────────────────
export function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-dvh bg-[var(--bg-base)] flex">
      {/* Panel esquerra — decoratiu (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(58%_0.22_290)] via-[oklch(62%_0.25_305)] to-[oklch(65%_0.25_340)]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-8 shadow-2xl">
            <span className="font-display font-bold text-4xl">E</span>
          </div>
          <h2 className="font-display font-bold text-4xl mb-4">Estudi360</h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">
            El teu assistent acadèmic intel·ligent.
            Gestiona tasques, exàmens, notes i molt més.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 w-full max-w-xs">
            {[
              { n: '📋', label: 'Tasques' },
              { n: '📅', label: 'Exàmens' },
              { n: '🍅', label: 'Pomodoro' },
              { n: '📊', label: 'Estadístiques' },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/15">
                <div className="text-2xl mb-1">{f.n}</div>
                <div className="text-xs font-medium text-white/80">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel dret — formulari */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-all"
            aria-label="Canviar tema"
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-fade-in-up">
            <Outlet />
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            © 2025 Estudi360. Tots els drets reservats.
          </p>
        </div>
      </div>
    </div>
  );
}
