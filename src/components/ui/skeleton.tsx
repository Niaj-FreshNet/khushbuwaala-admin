import { cn } from "@/lib/utils"
import React from "react"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer" | "pulse" | "wave"
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full"
  children?: React.ReactNode
}

function Skeleton({
  className,
  variant = "shimmer",
  rounded = "md",
  children,
  ...props
}: SkeletonProps) {
  const baseClasses = "bg-gray-200 dark:bg-gray-800"
  
  const variantClasses = {
    default: "animate-pulse",
    shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-white/20 dark:before:via-white/10 before:to-transparent before:animate-shimmer",
    pulse: "animate-pulse",
    wave: "animate-bounce"
  }
  
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md", 
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full"
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        roundedClasses[rounded],
        className
      )}
      role="status"
      aria-label="Loading..."
      {...props}
    >
      {children}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Predefined skeleton components for common use cases
export function SkeletonText({ 
  lines = 1, 
  className,
  ...props 
}: { 
  lines?: number 
  className?: string 
} & Omit<SkeletonProps, 'children'>) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-4",
            index === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
          {...props}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className, ...props }: { className?: string } & Omit<SkeletonProps, 'children'>) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-48 w-full" rounded="lg" {...props} />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" {...props} />
        <Skeleton className="h-4 w-1/2" {...props} />
      </div>
    </div>
  )
}

export function SkeletonAvatar({ 
  size = "md",
  className,
  ...props 
}: { 
  size?: "sm" | "md" | "lg" | "xl"
  className?: string 
} & Omit<SkeletonProps, 'children'>) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }
  
  return (
    <Skeleton
      className={cn(sizeClasses[size], className)}
      rounded="full"
      {...props}
    />
  )
}

export function SkeletonButton({ 
  size = "default",
  className,
  ...props 
}: { 
  size?: "sm" | "default" | "lg"
  className?: string 
} & Omit<SkeletonProps, 'children'>) {
  const sizeClasses = {
    sm: "h-8 w-20",
    default: "h-9 w-24",
    lg: "h-12 w-32"
  }
  
  return (
    <Skeleton
      className={cn(sizeClasses[size], className)}
      rounded="md"
      {...props}
    />
  )
}

export function SkeletonList({ 
  items = 3,
  className,
  ...props 
}: { 
  items?: number
  className?: string 
} & Omit<SkeletonProps, 'children'>) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <SkeletonAvatar {...props} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" {...props} />
            <Skeleton className="h-3 w-1/2" {...props} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ 
  rows = 5,
  columns = 4,
  className,
  ...props 
}: { 
  rows?: number
  columns?: number
  className?: string 
} & Omit<SkeletonProps, 'children'>) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex space-x-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-6 flex-1" {...props} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" {...props} />
          ))}
        </div>
      ))}
    </div>
  )
}

// Main export
export { Skeleton }