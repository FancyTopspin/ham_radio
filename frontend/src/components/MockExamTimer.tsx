import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface MockExamTimerProps {
  initialSeconds: number;
  isPaused: boolean;
  onTimeExpired: () => void;
}

export const MockExamTimer: React.FC<MockExamTimerProps> = ({
  initialSeconds,
  isPaused,
  onTimeExpired,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeExpired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft <= 300; // <= 5 minutes

  return (
    <div
      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm border shadow-xs transition-colors ${
        isUrgent
          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
          : 'bg-slate-100 text-slate-800 border-slate-200'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-rose-600" />
      ) : (
        <Clock className="w-4 h-4 text-slate-500" />
      )}
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};
