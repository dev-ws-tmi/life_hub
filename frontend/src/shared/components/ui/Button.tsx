import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

// ── Variants ──────────────────────────────────────────────────────────────────
const variants = {
  primary: [
    'bg-brand-500 text-white',
    'hover:bg-brand-600',
    'shadow-[0_4px_14px_oklch(58%_var(--brand-chroma)_var(--brand-hue)_/_0.35)]',
    'hover:shadow-[0_6px_20px_oklch(58%_var(--brand-chroma)_var(--brand-hue)_/_0.45)]',
    'active:scale-[0.98]',
  ].join(' '),
  secondary: [
    'bg-[var(--bg-elevated)] text-[var(--text-primary)]',
    'border border-[var(--border-default)]',
    'hover:bg-[var(--bg-overlay)] hover:border-brand-500/40',
  ].join(' '),
  ghost: [
    'text-[var(--text-secondary)]',
    'hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
  ].join(' '),
  danger: [
    'bg-[oklch(65%_0.25_25)] text-white',
    'hover:bg-[oklch(60%_0.25_25)]',
    'shadow-[0_4px_14px_oklch(65%_0.25_25_/_0.3)]',
  ].join(' '),
  outline: [
    'border border-[var(--border-default)] text-[var(--text-primary)]',
    'hover:bg-[var(--bg-elevated)]',
  ].join(' '),
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
  xl: 'h-14 px-8 text-lg gap-3',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium rounded-xl',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
          // Variant i size
          variants[variant],
          sizes[size],
          // Opcionals
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size === 'sm' ? 'xs' : 'sm'} />
            <span>Carregant...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
  const s = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5' }[size];
  return (
    <svg
      className={cn('animate-spin', s)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
