import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 52,
  strokeWidth = 4.5,
  className = '',
  showText = true,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Colors matching the mobile app reference
  const isComplete = clamped === 100;
  const isStarted = clamped > 0;

  const strokeColor = isComplete
    ? '#06b6d4' // vibrant cyan / teal
    : isStarted
    ? '#06b6d4'
    : '#e2e8f0'; // light gray when 0%

  const textColor = isComplete
    ? 'text-cyan-600 font-bold'
    : isStarted
    ? 'text-cyan-600 font-bold'
    : 'text-slate-400 font-semibold';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress stroke */}
        {isStarted && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
      {showText && (
        <span
          className={`absolute text-[11px] tracking-tight leading-none ${textColor}`}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
};
