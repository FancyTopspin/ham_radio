import React from 'react';
import {
  BookOpen,
  Award,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FileText,
  GraduationCap,
  MessageSquare,
  Layers,
  Flame,
  Trophy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStreakInfo } from '../engine/dailyChallengeEngine';
import type { LicenseClassType } from '../types';

interface DashboardViewProps {
  onStartStudy: () => void;
  onStartMock: () => void;
  onStartMistakes: () => void;
  onOpenAnalytics: () => void;
  onOpenTopics?: () => void;
  onOpenDailyChallenge?: () => void;
  onOpenLeaderboard?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartStudy,
  onStartMock,
  onStartMistakes,
  onOpenTopics,
  onOpenDailyChallenge,
  onOpenLeaderboard,
}) => {
  const { activeClass, setActiveClass, bucketCounts, forceRefreshPool, isHydrating, openFeedbackModal } = useApp();
  const streakInfo = getStreakInfo(activeClass);

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
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-4 sm:p-8 shadow-lg relative overflow-hidden border border-slate-800 space-y-4 sm:space-y-6">
        
        {/* Interactive 3-Class Segmented Switcher */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
              <span>Target License Class:</span>
            </span>
            <span className="text-xs text-blue-300 font-medium hidden sm:inline">
              Click any tier to switch study pools instantly
            </span>
          </div>

          {/* 3-Column Grid on ALL devices (1 clean row on mobile, never stacked!) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 bg-slate-950/70 backdrop-blur border border-slate-700/70 rounded-xl sm:rounded-2xl">
            {([
              { id: 'TECH', label: 'Technician', shortLabel: 'Tech', element: 'Element 2', shortElement: 'El. 2', quota: '35Q Exam', cycle: '2026–2030' },
              { id: 'GEN', label: 'General', shortLabel: 'General', element: 'Element 3', shortElement: 'El. 3', quota: '35Q Exam', cycle: '2023–2027' },
              { id: 'EXTRA', label: 'Amateur Extra', shortLabel: 'Extra', element: 'Element 4', shortElement: 'El. 4', quota: '50Q Exam', cycle: '2024–2028' },
            ] as const).map((tier) => {
              const isActive = activeClass === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setActiveClass(tier.id)}
                  className={`flex flex-col items-center sm:items-start px-2 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl transition text-center sm:text-left cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                    <span className="font-bold sm:font-extrabold text-xs sm:text-base tracking-tight truncate">
                      <span className="sm:hidden">{tier.shortLabel}</span>
                      <span className="hidden sm:inline">{tier.label}</span>
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded mt-0.5 sm:mt-0 ${
                        isActive
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="sm:hidden">{tier.shortElement}</span>
                      <span className="hidden sm:inline">{tier.element}</span>
                    </span>
                  </div>
                  <div
                    className={`hidden sm:flex text-[11px] mt-1 items-center space-x-1.5 ${
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
        <div className="relative z-10 max-w-2xl space-y-2 sm:space-y-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            FCC {currentInfo.name} Prep
          </h1>
          <p className="text-slate-300 text-xs sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-none">
            Zero-friction local study platform. Practice official FCC question pools with smart spaced repetition, 
            exact blueprint mock exams, and instant weak-spot isolation.
          </p>

          <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
            {onOpenTopics && (
              <button
                onClick={onOpenTopics}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 sm:space-x-2 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Browse Lessons</span>
              </button>
            )}

            <button
              onClick={onStartStudy}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 sm:space-x-2 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Practice All</span>
            </button>

            <button
              onClick={onStartMock}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 sm:space-x-2 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Take Mock ({currentInfo.quota}Q)</span>
            </button>

            {bucketCounts.mistakesCount > 0 && (
              <button
                onClick={onStartMistakes}
                className="px-3.5 py-2 sm:px-5 sm:py-3 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 sm:space-x-2 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Drill ({bucketCounts.mistakesCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Daily Challenge & Leaderboard Spotlight Card */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4 w-full md:w-auto">
          <div className="p-3 bg-white/20 backdrop-blur rounded-2xl shrink-0">
            <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg">
                Daily 5-Question Challenge
              </span>
              <span className="px-2 py-0.5 bg-black/20 rounded-full text-[10px] sm:text-xs font-bold text-amber-100 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>{streakInfo.currentStreak} Day Streak</span>
              </span>
            </div>
            <p className="text-amber-100 text-xs sm:text-sm mt-0.5">
              {streakInfo.isCompletedToday
                ? `✓ Completed today (${streakInfo.todayScore?.score || 5}/5)! Come back tomorrow to keep your streak alive.`
                : 'Quick 2-minute daily blitz to build your streak and earn +50 XP on the community leaderboard.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1.5 cursor-pointer backdrop-blur"
            >
              <Trophy className="w-4 h-4 text-amber-200" />
              <span>Leaderboard</span>
            </button>
          )}

          {onOpenDailyChallenge && (
            <button
              onClick={onOpenDailyChallenge}
              className={`px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer ${
                streakInfo.isCompletedToday
                  ? 'bg-amber-900/60 text-amber-200 hover:bg-amber-900/80'
                  : 'bg-white text-orange-600 hover:bg-amber-50 shadow-orange-700/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{streakInfo.isCompletedToday ? 'Review Challenge' : 'Play Today’s Blitz'}</span>
            </button>
          )}
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

      {/* Community Feedback & Pass Announcement */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Passed Your Exam or Have Suggestions?</span>
          </h4>
          <p className="text-xs text-slate-500 max-w-xl">
            Whether you just earned your license, found an explanation that could be clearer, or have an idea for a feature—we would love your feedback!
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => openFeedbackModal({ category: 'passed_exam' })}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            🎉 I Passed!
          </button>
          <button
            onClick={() => openFeedbackModal()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Give Feedback
          </button>
        </div>
      </div>

    </div>
  );
};
