'use client';

/**
 * Phone layout for admin lists. Each list page renders its desktop <Table> inside
 * `hidden md:block` and the same rows as <MobileCard>s inside <MobileCardList> (md:hidden),
 * so phones get readable cards with large touch targets instead of a sideways-scrolling table.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function MobileCardList({
  children,
  className,
  isLoading,
  isEmpty,
  emptyText = 'Nothing to show.',
}: {
  children?: ReactNode;
  className?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
}) {
  return (
    <div className={cn('space-y-2 md:hidden', className)}>
      {isLoading ? (
        [...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white" />
        ))
      ) : isEmpty ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">
          {emptyText}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function MobileCard({
  title,
  subtitle,
  badge,
  leading,
  onOpen,
  selected,
  children,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  /** e.g. a selection checkbox */
  leading?: ReactNode;
  /** tapping the card body opens details */
  onOpen?: () => void;
  selected?: boolean;
  children?: ReactNode;
  /** buttons/menus shown in the card footer */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white shadow-2xs transition-colors',
        selected ? 'border-orange-400 ring-1 ring-orange-200' : 'border-gray-200',
        className
      )}
    >
      <div className="flex items-start gap-2 p-3">
        {leading && <div className="pt-0.5">{leading}</div>}
        <div
          className={cn('min-w-0 flex-1', onOpen && 'cursor-pointer')}
          onClick={onOpen}
          role={onOpen ? 'button' : undefined}
          tabIndex={onOpen ? 0 : undefined}
          onKeyDown={(e) => {
            if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onOpen();
            }
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-gray-900">{title}</div>
              {subtitle && <div className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</div>}
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {children && <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">{children}</div>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-3 py-2">{actions}</div>
      )}
    </div>
  );
}

export function MobileField({
  label,
  children,
  className,
  full,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  /** span both columns */
  full?: boolean;
}) {
  return (
    <div className={cn('min-w-0', full && 'col-span-2', className)}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="truncate text-xs font-medium text-gray-800">{children}</div>
    </div>
  );
}
