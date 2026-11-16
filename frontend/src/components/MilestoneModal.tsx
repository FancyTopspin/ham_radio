import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, ArrowRight, Sparkles } from 'lucide-react';
import type { SessionMilestoneStats } from '../types';

interface MilestoneModalProps {
  stats: SessionMilestoneStats;
  onKeepGoing: () => void;
  onExit: () => void;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  stats,
  onKeepGoing,
  onExit,
}) => {
  const isPassing = stats.accuracy >= 74;

  useEffect(() => {
    if (isPassing) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isPassing]);

  const minutes = Math.floor(stats.timeSpentMs / 60000);
  const seconds = Math.floor((stats.timeSpentMs % 60000) / 1000);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-600">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-slate-900">Batch Completed!</h3>
          <p className="text-sm text-slate-500 mt-1">
            Great session! Here is your milestone progress:
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block">Accuracy</span>
            <span className={`text-2xl font-bold ${isPassing ? 'text-emerald-600' : 'text-slate-800'}`}>
              {stats.accuracy}%
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block">Score</span>
            <span className="text-2xl font-bold text-slate-800">
              {stats.correctCount} / {stats.totalAnswered}
            </span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-700 block flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Promotions
            </span>
            <span className="text-2xl font-bold text-emerald-800">
              +{stats.promotions}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block">Time Spent</span>
            <span className="text-2xl font-bold text-slate-800">
              {minutes}m {seconds}s
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onKeepGoing}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Keep Going</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full py-2.5 text-sm text-slate-600 hover:text-slate-900 font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
