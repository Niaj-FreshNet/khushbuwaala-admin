// File: components/MetricCard.tsx
'use client';

import Image from "next/image";

interface MetricCardProps {
    label: string;
    value: string | number;
    circleColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, circleColor }) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate mb-1">{label}</h3>
                <p className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">{value}</p>
            </div>
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                style={{ backgroundColor: circleColor }}
            >
                <Image
                    src="/images/vector.png"
                    alt={`${label} icon`}
                    width={20}
                    height={20}
                    className="brightness-0 invert opacity-90"
                />
            </div>
        </div>
    );
};

export default MetricCard;