'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  className,
}: AuthLayoutProps) {
  return (
    <section className="w-full py-6 sm:py-10 px-4 sm:px-6">
      <div className={cn('w-full max-w-md mx-auto', className)}>
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-stone-600 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {/* Content Container */}
        <div>{children}</div>
      </div>
    </section>
  );
}