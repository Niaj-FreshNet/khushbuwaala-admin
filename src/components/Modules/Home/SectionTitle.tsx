"use client";

import type React from "react";
import { useMemo, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Sparkles, Star } from "lucide-react";
import { useInViewOnce } from "@/components/Shared/useInViewOnce";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  variant?: "default" | "gradient" | "elegant" | "modern" | "premium";
  animated?: boolean;
  icon?: React.ReactNode;
  showDecorations?: boolean;
  underlineVariant?: "default" | "wide" | "full";
}

export function SectionTitle({
  title,
  subtitle,
  className,
  variant = "default",
  animated = true,
  icon,
  showDecorations = true,
  underlineVariant = "default",
}: SectionTitleProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const inView = useInViewOnce(wrapRef, { threshold: 0.15 });

  const styles = useMemo(() => {
    const base = {
      container: "",
      title: "text-gray-900",
      accent: "",
    };

    if (variant === "gradient") {
      base.title =
        "bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 bg-clip-text text-transparent";
    }

    if (variant === "premium") {
      // ✅ Soft, premium whitish aesthetic with clean dark text
      base.title = "text-gray-900 font-extrabold tracking-tight";
      base.container =
        "rounded-none bg-gradient-to-r from-rose-50/40 via-red-50 to-pink-50/40 border-y border-gray-100/80 py-2";
    }

    return base;
  }, [variant]);

  const underlineStyles = useMemo(() => {
    const wide = underlineVariant === "wide";
    const full = underlineVariant === "full";

    return {
      widthClass: full ? "w-full" : wide ? "w-64 md:w-80" : "w-36",
      heightClass: "h-1",
      gradientClass: "bg-gradient-to-r from-red-400 via-pink-400 to-purple-400",
      shadowClass: "shadow-xs",
      borderClass: "",
      showSideLines: !full,
    };
  }, [underlineVariant]);

  return (
    <div
      ref={wrapRef}
      className={cn("text-center py-1.5 relative overflow-hidden", styles.container, className)}
    >
      {showDecorations && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={cn(
                "absolute top-4 left-1/4 w-2 h-2 bg-red-400 rounded-full opacity-50",
                inView && !reduce && "animate-bounce"
              )}
              style={{ animationDelay: "0.5s" }}
            />
            <div
              className={cn(
                "absolute top-8 right-1/3 w-1 h-1 bg-pink-400 rounded-full opacity-40",
                inView && !reduce && "animate-pulse"
              )}
              style={{ animationDelay: "1s" }}
            />
            <div
              className={cn(
                "absolute bottom-6 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-40",
                inView && !reduce && "animate-bounce"
              )}
              style={{ animationDelay: "1.5s" }}
            />
            <div
              className={cn(
                "absolute bottom-4 right-1/4 w-1 h-1 bg-red-300 rounded-full opacity-30",
                inView && !reduce && "animate-pulse"
              )}
              style={{ animationDelay: "2s" }}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 to-transparent blur-3xl opacity-40" />
        </>
      )}

      <div className="relative z-10">
        <h2
          className={cn(
            "text-2xl md:text-3xl font-bold mb-1 relative",
            styles.title,
            animated && !reduce
              ? cn(
                  "transition-all duration-700 ease-out",
                  inView ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[6px]"
                )
              : "opacity-100"
          )}
        >
          {icon && <span className="inline-flex items-center mr-2 align-middle">{icon}</span>}

          {variant === "premium" && (
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 opacity-70 animate-pulse" />
          )}

          {variant === "elegant" && (
            <>
              <Star className="absolute -top-2 -left-8 h-4 w-4 text-red-400 opacity-40" />
              <Star className="absolute -top-2 -right-8 h-4 w-4 text-red-400 opacity-40" />
            </>
          )}

          <p className="mb-1">{title}</p>
        </h2>

        {subtitle && (
          <p
            className={cn(
              variant === "premium" ? "text-gray-600" : "text-gray-600",
              "text-sm md:text-base mb-1.5 max-w-2xl mx-auto",
              animated && !reduce
                ? cn(
                    "transition-all duration-700 ease-out delay-75",
                    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )
                : "opacity-100"
            )}
          >
            {subtitle}
          </p>
        )}

        <div className="flex justify-center items-center space-x-4 -mb-1 w-full">
          <div className={cn("relative", underlineVariant === "full" ? "w-full" : underlineStyles.widthClass)}>
            <div
              className={cn(
                "origin-center",
                animated && !reduce
                  ? cn("transition-all duration-700 ease-out", inView ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0")
                  : "opacity-100 scale-x-100"
              )}
            >
              {underlineVariant === "full" && (
                <div className="absolute inset-x-0 -bottom-1 h-4 bg-gradient-to-r from-red-400/30 via-pink-400/30 to-purple-400/30 blur-md opacity-40 rounded-full" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-pink-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}