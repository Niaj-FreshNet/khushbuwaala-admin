// File: components/MetricCard.tsx
'use client';

import Image from "next/image";

interface MetricCardProps {
    label: string;
    value: string | number;
    circleColor: string;
    key: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, circleColor }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between gap-4">
            {/* Label and Value */}
            <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-500 mb-4">{label}</h3>
                <p className="text-2xl font-semibold text-gray-800">{value}</p>
            </div>
            {/* Colored Circle with Icon */}
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: circleColor }}
            >
                <Image
                    src="/images/vector.png"
                    alt={`${label} icon`}
                    width={24}
                    height={24}
                    className="text-white" />
            </div>
        </div>
    );
};

export default MetricCard;