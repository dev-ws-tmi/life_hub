import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
            {props.required && <span className="text-[oklch(65%_0.25_25)] ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
              <LeftIcon size={16} />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base
              'w-full h-10 rounded-xl text-sm text-[var(--text-primary)]',
              'bg-[var(--bg-elevated)] border border-[var(--border-default)]',
              'placeholder:text-[var(--text-muted)]',
              // Focus
              'focus:outline-none focus:border-brand-500',
              'focus:ring-2 focus:ring-brand-500/20',
              // Error
              error && 'border-[oklch(65%_0.25_25)] focus:border-[oklch(65%_0.25_25)] focus:ring-[oklch(65%_0.25_25_/_0.2)]',
              // Padding icons
              LeftIcon ? 'pl-9 pr-4' : 'px-4',
              RightIcon ? 'pr-10' : '',
              // Transition
              'transition-all duration-150',
              className
            )}
            {...props}
          />

          {RightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]',
                'hover:text-[var(--text-primary)] transition-colors',
                onRightIconClick && 'cursor-pointer'
              )}
              tabIndex={-1}
            >
              <RightIcon size={16} />
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-[oklch(65%_0.25_25)] flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--text-muted)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
