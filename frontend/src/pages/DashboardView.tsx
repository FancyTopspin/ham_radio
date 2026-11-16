import React from 'react';
import { BookOpen, Award, AlertCircle, Sparkles, RefreshCw, FileText, GraduationCap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LicenseClassType } from '../types';

interface DashboardViewProps {
  onStartStudy: () => void;
  onStartMock: () => void;
  onStartMistakes: () => void;
  onOpenAnalytics: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartStudy,
  onStartMock,
  onStartMistakes,
}) => {
  const { activeClass, setActiveClass, bucketCounts, forceRefreshPool, isHydrating } = useApp();

  const classDisplay: Record<LicenseClassType, { name: string; quota: number; pass: number }> = {
    TECH: { name: 'Technician Class', quota: 35, pass: 26 },
    GEN: { name: 'General Class', quota: 35, pass: 26 },
    EXTRA: { name: 'Amateur Extra Class', quota: 50, pass: 37 },
  };

  const currentInfo = classDisplay[activeClass];
  const masteryPercentage = bucketCounts.total > 0
    ? Math.round((bucketCounts.mastered / bucketCounts.total) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden border border-slate-800 space-y-6">
        
        {/* Interactive 3-Class Segmented Switcher */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Target FCC License Class:</span>
            </span>
            <span className="text-xs text-blue-300 font-medium hidden sm:inline">
              Click any tier below to switch study pools instantly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-slate-950/70 backdrop-blur border border-slate-700/70 rounded-2xl">
            {([
              { id: 'TECH', label: 'Technician', element: 'Element 2', quota: '35Q Exam', cycle: '2022–2026' },
              { id: 'GEN', label: 'General', element: 'Element 3', quota: '35Q Exam', cycle: '2023–2027' },
              { id: 'EXTRA', label: 'Amateur Extra', element: 'Element 4', quota: '50Q Exam', cycle: '2024–2028' },
            ] as const).map((tier) => {
              const isActive = activeClass === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setActiveClass(tier.id)}
                  className={`flex flex-col items-start px-4 py-3 rounded-xl transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight">
                      {tier.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tier.element}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] mt-1 flex items-center space-x-1.5 ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{tier.quota}</span>
                    <span>•</span>
                    <span>{tier.cycle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Title & Actions */}
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            FCC {currentInfo.name} Prep
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Zero-friction local study platform. Practice official FCC question pools with smart spaced repetition, 
            exact blueprint mock exams, and instant weak-spot isolation.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onStartStudy}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Start Studying</span>
            </button>

            <button
              onClick={onStartMock}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Take Mock Exam ({currentInfo.quota}Q)</span>
            </button>

            {bucketCounts.mistakesCount > 0 && (
              <button
                onClick={onStartMistakes}
                className="px-5 py-3 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Drill Mistakes ({bucketCounts.mistakesCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spaced Repetition Buckets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Study Engine Buckets</h2>
          <button
            onClick={forceRefreshPool}
            disabled={isHydrating}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center space-x-1 font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isHydrating ? 'animate-spin' : ''}`} />
            <span>Sync Pool</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Unseen */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unseen</span>
              <span className="w-3 h-3 rounded-full bg-slate-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-800">{bucketCounts.unseen}</div>
            <p className="text-xs text-slate-500">Not yet attempted</p>
          </div>

          {/* Needs Work */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-2 bg-rose-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Needs Work</span>
              <span className="w-3 h-3 rounded-full bg-rose-500" />
            </div>
            <div className="text-3xl font-extrabold text-rose-700">{bucketCounts.needs_work}</div>
            <p className="text-xs text-slate-500">Answered wrong recently</p>
          </div>

          {/* Learning */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-2 bg-amber-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Learning</span>
              <span className="w-3 h-3 rounded-full bg-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-amber-700">{bucketCounts.learning}</div>
            <p className="text-xs text-slate-500">1 consecutive correct</p>
          </div>

          {/* Mastered */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-2 bg-emerald-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Mastered</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-700">{bucketCounts.mastered}</div>
            <p className="text-xs text-slate-500">2+ correct • 7-day decay</p>
          </div>
        </div>
      </div>

      {/* Progress & Exam Readiness Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pool Mastery Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Overall Pool Mastery</h3>
            <span className="text-sm font-extrabold text-blue-600">{masteryPercentage}%</span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${masteryPercentage}%` }}
            />
          </div>

          <p className="text-xs text-slate-500">
            {bucketCounts.mastered} of {bucketCounts.total} questions mastered. Aim for 85%+ mastery before exam day.
          </p>
        </div>

        {/* Mock Exam Simulation Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">Exam Specifications</h3>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex justify-between">
              <span>Exam Question Count:</span>
              <span className="font-bold text-slate-900">{currentInfo.quota} Questions</span>
            </li>
            <li className="flex justify-between">
              <span>Required to Pass:</span>
              <span className="font-bold text-emerald-600">{currentInfo.pass} / {currentInfo.quota} (74%)</span>
            </li>
            <li className="flex justify-between">
              <span>Time Limit:</span>
              <span className="font-bold text-slate-900">{activeClass === 'EXTRA' ? '60 mins' : '45 mins'}</span>
            </li>
          </ul>
          <button
            onClick={onStartMock}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
          >
            Launch Practice Exam
          </button>
        </div>

        {/* Weak Spot Isolation Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>Mistakes Queue</span>
          </h3>
          <p className="text-xs text-slate-500">
            {bucketCounts.mistakesCount > 0
              ? `You currently have ${bucketCounts.mistakesCount} questions needing review. Missed questions stay here until answered correctly twice.`
              : `Your mistakes queue is clean! All missed questions have been cleared.`}
          </p>
          <button
            onClick={onStartMistakes}
            disabled={bucketCounts.mistakesCount === 0}
            className={`w-full py-2 text-xs font-bold rounded-lg transition ${
              bucketCounts.mistakesCount > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {bucketCounts.mistakesCount > 0 ? 'Drill Mistakes Now' : 'No Mistakes Pending'}
          </button>
        </div>

      </div>

      {/* Club & VE Printable Resources Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-blue-900/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exam Sessions & Radio Clubs</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight">Printable 1-Page VE Handout (PDF)</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Administering or attending an exam session? Download our official 1-page flyer equipped with an instant-access QR code, 4-step licensing checklist, and write-in local club notes.
          </p>
        </div>
        <a
          href="/ve-handout-flyer.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download="HamRadio-VE-Handout-Flyer.pdf"
          className="shrink-0 inline-flex items-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Download VE Flyer</span>
        </a>
      </div>

    </div>
  );
};
