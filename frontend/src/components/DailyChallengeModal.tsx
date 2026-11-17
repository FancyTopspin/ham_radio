import React, { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle,
  XCircle,
  ArrowRight,
  X,
  Sparkles,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  generateDailyChallenge,
  submitDailyChallengeCompletion,
  getStreakInfo,
  type DailyChallengeQuestion,
} from '../engine/dailyChallengeEngine';
import { MarkdownRenderer } from './MarkdownRenderer';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLeaderboard?: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  onOpenLeaderboard,
}) => {
  const { activeClass, refreshStats } = useApp();
  const [questions, setQuestions] = useState<DailyChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<
    { questionId: string; selectedChoiceId: string; isCorrect: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [streakResult, setStreakResult] = useState<{
    streak: number;
    xpEarned: number;
    totalXp: number;
  } | null>(null);

  const streakInfo = getStreakInfo(activeClass);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setCurrentIndex(0);
    setSelectedChoiceId(null);
    setUserAnswers([]);
    setIsCompleted(false);
    setStreakResult(null);

    const init = async () => {
      setLoading(true);
      const qs = await generateDailyChallenge(activeClass);
      setQuestions(qs);
      setLoading(false);
    };

    init();
  }, [isOpen, activeClass]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const isAnswered = selectedChoiceId !== null;

  const handleSelectChoice = (choiceId: string, isCorrect: boolean) => {
    if (isAnswered) return;
    setSelectedChoiceId(choiceId);

    const newAnswers = [
      ...userAnswers,
      {
        questionId: currentQ.question.id,
        selectedChoiceId: choiceId,
        isCorrect,
      },
    ];
    setUserAnswers(newAnswers);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedChoiceId(null);
    } else {
      // Completed all 5 questions
      setLoading(true);
      const res = await submitDailyChallengeCompletion(activeClass, userAnswers);
      setStreakResult(res);
      setIsCompleted(true);
      await refreshStats();
      setLoading(false);
    }
  };

  const score = userAnswers.filter(a => a.isCorrect).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Daily 5-Question Challenge
              </h3>
              <p className="text-amber-100 text-xs">
                {activeClass} Pool • Daily streak blitz
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2.5 py-1 bg-black/20 rounded-full text-xs font-bold text-amber-100">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>{streakInfo.currentStreak} Day Streak</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600" />
            <p className="text-sm font-semibold">Preparing today's questions...</p>
          </div>
        )}

        {/* Challenge Completed / Result Screen */}
        {!loading && isCompleted && streakResult && (
          <div className="p-6 sm:p-8 text-center space-y-6 overflow-y-auto">
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-amber-500/30">
                <Flame className="w-10 h-10 animate-bounce" />
              </div>
              <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-spin" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Daily Challenge Complete!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {score === 5
                  ? "Flawless performance! 5 out of 5 correct on today's pool."
                  : `Great effort! You scored ${score} out of 5 questions.`}
              </p>
            </div>

            {/* Streak & XP Rewards Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm mx-auto">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                  Streak Flame
                </span>
                <div className="flex items-center justify-center space-x-1 mt-1 text-amber-600">
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span className="text-2xl font-black">
                    {streakResult.streak} {streakResult.streak === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  XP Earned
                </span>
                <div className="flex items-center justify-center space-x-1 mt-1 text-emerald-600">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-2xl font-black">+{streakResult.xpEarned} XP</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {onOpenLeaderboard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLeaderboard();
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl shadow-md hover:from-amber-500 hover:to-orange-500 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Check Leaderboard</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Active Quiz Question Screen */}
        {!loading && !isCompleted && currentQ && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Progress Bar & Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-700">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="font-mono text-blue-600 font-extrabold">
                  {currentQ.question.question_code}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{
                    width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
              <MarkdownRenderer content={currentQ.question.question_text} />
            </div>

            {/* Figure / Diagram */}
            {currentQ.question.has_diagram && currentQ.question.diagram_figure_name && (
              <div className="my-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-xs font-bold text-slate-500 block mb-1">
                  Refer to Figure: {currentQ.question.diagram_figure_name}
                </span>
                <div className="text-xs text-slate-400 italic">
                  [Schematic diagram rendered in pool figures]
                </div>
              </div>
            )}

            {/* Choices */}
            <div className="space-y-2.5">
              {currentQ.choices.map((choice, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx] || '';
                const isSelected = selectedChoiceId === choice.id;
                const isCorrect = !!choice.is_correct;

                let btnStyle = 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 text-slate-800';
                let badgeStyle = 'bg-slate-100 text-slate-600';

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-400';
                    badgeStyle = 'bg-emerald-600 text-white';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-medium';
                    badgeStyle = 'bg-rose-500 text-white';
                  } else {
                    btnStyle = 'border-slate-200 bg-slate-50/60 text-slate-400 opacity-60';
                    badgeStyle = 'bg-slate-200 text-slate-400';
                  }
                }

                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectChoice(choice.id, !!choice.is_correct)}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-xl border transition flex items-start space-x-3 cursor-pointer ${btnStyle}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}`}
                    >
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm flex-1 leading-snug">
                      <MarkdownRenderer content={choice.choice_text} />
                    </span>
                    {isAnswered && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box on answer */}
            {isAnswered && currentQ.explanation && (
              <div className="p-3.5 sm:p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs sm:text-sm space-y-1.5 animate-fade-in">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Elmer Explanation</span>
                </span>
                <div className="text-slate-700 leading-relaxed">
                  <MarkdownRenderer content={currentQ.explanation.explanation_markdown} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Next Button */}
        {!loading && !isCompleted && isAnswered && (
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {userAnswers[currentIndex]?.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <span>{currentIndex === questions.length - 1 ? 'Finish Challenge 🎉' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
