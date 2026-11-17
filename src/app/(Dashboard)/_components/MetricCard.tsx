// File: components/MetricCard.tsx
'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock } from "lucide-react";

interface MetricCardProps {
    label: string;
    value: string | number;
    circleColor: string;
    blurTimeoutSeconds?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
    label, 
    value, 
    circleColor, 
    blurTimeoutSeconds = 0 
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isVisible && blurTimeoutSeconds > 0) {
            timer = setTimeout(() => {
                setIsVisible(false);
            }, blurTimeoutSeconds * 1000);
        }
        return () => clearTimeout(timer);
    }, [isVisible, blurTimeoutSeconds]);

    // Enhanced secure masking helper with frosted-glass effect
    const maskContent = (content: string) => (
        <span 
            role="button"
            tabIndex={0}
            aria-label={isVisible ? "Hide sensitive value" : "Reveal sensitive value"}
            onClick={(e) => {
                e.stopPropagation();
                setIsVisible(!isVisible);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsVisible(!isVisible);
                }
            }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 select-none cursor-pointer ${
                isVisible 
                    ? "text-stone-900 bg-stone-50/50" 
                    : "filter blur-sm bg-stone-100 text-stone-400 hover:bg-stone-200/70 border border-stone-200/60 shadow-2xs"
            }`}
            title={isVisible ? "Click to hide" : "Click to reveal"}
        >
            {!isVisible && <Lock className="w-3 h-3 text-stone-400 shrink-0 inline" />}
            <span>{isVisible ? content : "••••••••"}</span>
        </span>
    );

    // Parse and handle both text and amount masking together
    const renderSmartMaskedValue = (val: string | number) => {
        const strVal = String(val);
        
        // If the value is a combined summary string like "Orders: 5 | Sales: ৳12,500"
        if (strVal.includes("|") || strVal.includes("Sales:")) {
            const parts = strVal.split("|").map((part) => {
                if (part.toLowerCase().includes("sales") || part.includes("৳")) {
                    const [title, amount] = part.split(":");
                    const fullText = `${title.trim()}: ${amount ? amount.trim() : part.trim()}`;
                    return (
                        <span key={part} className="inline-flex items-center">
                            {maskContent(fullText)}
                        </span>
                    );
                }
                return part;
            });
            return <div className="flex items-center gap-2 flex-wrap">{parts}</div>;
        }

        // If it's a standalone amount or sales card
        if (typeof val === "number" || strVal.startsWith("৳") || label.toLowerCase().includes("sales")) {
            return maskContent(strVal);
        }

        // Otherwise it's purely a count or text, keep it unblurred
        return <span className="text-stone-900">{strVal}</span>;
    };

    return (
        <div 
            onClick={() => setIsVisible(!isVisible)}
            className="bg-white p-2 sm:p-3 rounded-2xl border border-stone-200/70 shadow-xs hover:shadow-md hover:border-stone-300/80 flex items-center justify-between gap-4 relative group transition-all duration-200 cursor-pointer active:scale-[0.99]"
        >
            {/* Label and Value Section */}
            <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider truncate" title={label}>
                        {label}
                    </h3>
                </div>
                <div className="font-bold text-stone-900 truncate">
                    {renderSmartMaskedValue(value)}
                </div>
            </div>

            {/* Colored Icon Badge */}
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: circleColor }}
            >
                <Image
                    src="/vector.png"
                    alt={`${label} icon`}
                    width={18}
                    height={18}
                    className="brightness-0 invert object-contain"
                />
            </div>
        </div>
    );
};

export default MetricCard;