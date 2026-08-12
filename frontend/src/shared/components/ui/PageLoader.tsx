import { cn } from '@/shared/lib/utils';

// ── Badge ─────────────────────────────────────────────────────────────────────
const badgeVariants = {
  default:  'bg-[var(--bg-overlay)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  brand:    'bg-brand-500/15 text-brand-500 border border-brand-500/30',
  success:  'bg-[oklch(68%_0.18_160_/_0.15)] text-[oklch(52%_0.18_160)] border border-[oklch(68%_0.18_160_/_0.3)]',
  warning:  'bg-[oklch(75%_0.18_80_/_0.15)] text-[oklch(55%_0.18_80)] border border-[oklch(75%_0.18_80_/_0.3)]',
  danger:   'bg-[oklch(65%_0.25_25_/_0.15)] text-[oklch(55%_0.25_25)] border border-[oklch(65%_0.25_25_/_0.3)]',
  violet:   'bg-[oklch(62%_0.25_305_/_0.15)] text-[oklch(52%_0.25_305)] border border-[oklch(62%_0.25_305_/_0.3)]',
  cyan:     'bg-[oklch(72%_0.18_210_/_0.15)] text-[oklch(48%_0.18_210)] border border-[oklch(72%_0.18_210_/_0.3)]',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof badgeVariants;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5',
        'text-xs font-medium rounded-full',
        badgeVariants[variant],
        className
      )}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current opacity-75 flex-shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'md',
}: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
  return (
    <div
      className={cn(
        'card',
        paddings[padding],
        (hoverable || onClick) && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── PageLoader ────────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-base)] z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 opacity-20 animate-pulse" />
          <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600" />
          <span className="absolute inset-0 flex items-center justify-center text-white font-display font-bold text-base tracking-tight">
            LH
          </span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-500"
              style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

// ── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mb-4 text-[var(--text-tertiary)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-tertiary)] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
