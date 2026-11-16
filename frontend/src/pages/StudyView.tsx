import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Question, StudyBucket, SessionMilestoneStats, StudyFocusPreset, SessionBatchSize } from '../types';
import { drawNextStudyQuestion, recordAttempt, type TransitionResult } from '../engine/studyEngine';
import { getSmartShuffledChoices, type DisplayedChoice } from '../engine/shuffler';
import { db } from '../db';
import { StudyCard } from '../components/StudyCard';
import { MilestoneModal } from '../components/MilestoneModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface StudyViewProps {
  onBackToDashboard: () => void;
}

export const StudyView: React.FC<StudyViewProps> = ({ onBackToDashboard }) => {
  const { activeClass, focusPreset, setFocusPreset, batchSize, setBatchSize, refreshStats } = useApp();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [shuffledChoices, setShuffledChoices] = useState<DisplayedChoice[]>([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentBucket, setCurrentBucket] = useState<StudyBucket>('unseen');
  const [transitionResult, setTransitionResult] = useState<TransitionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Batch Session State
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionPromotions, setSessionPromotions] = useState(0);
  const [sessionDemotions, setSessionDemotions] = useState(0);
  const sessionStartTime = useRef<number>(Date.now());
  const questionStartTime = useRef<number>(Date.now());
  const [milestoneStats, setMilestoneStats] = useState<SessionMilestoneStats | null>(null);

  // Focus presets labels
  const focusPresets: { id: StudyFocusPreset; label: string; desc: string }[] = [
    { id: 'balanced', label: 'Balanced', desc: '50% Review, 30% Learning, 20% New' },
    { id: 'learn_new', label: 'Learn New', desc: '70% Unseen questions' },
    { id: 'review_weaknesses', label: 'Review Weak', desc: '80% Needs Work & Learning' },
  ];

  // Batch sizes
  const batchOptions: SessionBatchSize[] = [10, 25, 50, 'continuous'];

  // Load next question
  const loadNextQuestion = useCallback(async () => {
    setIsLoading(true);
    setSelectedChoiceId(null);
    setShowFeedback(false);
    setTransitionResult(null);

    const q = await drawNextStudyQuestion(activeClass, focusPreset, currentQuestion ? [currentQuestion.id] : []);
    if (q) {
      setCurrentQuestion(q);
      setShuffledChoices(getSmartShuffledChoices(q));
      
      const state = await db.question_states.get(q.id);
      setCurrentBucket(state ? state.bucket : 'unseen');
      questionStartTime.current = Date.now();
    } else {
      setCurrentQuestion(null);
    }
    setIsLoading(false);
  }, [activeClass, focusPreset, currentQuestion]);

  useEffect(() => {
    loadNextQuestion();
  }, [activeClass, focusPreset]);

  // Handle choice selection
  const handleSelectChoice = async (choiceId: string) => {
    if (showFeedback || !currentQuestion) return;

    const durationMs = Date.now() - questionStartTime.current;
    const isCorrect = choiceId === currentQuestion.correct_choice_id;

    setSelectedChoiceId(choiceId);
    setShowFeedback(true);

    const result = await recordAttempt(currentQuestion, choiceId, isCorrect, durationMs, 'study');
    setTransitionResult(result);
    setCurrentBucket(result.newBucket);

    // Update session tracking
    const newCount = sessionCount + 1;
    const newCorrect = sessionCorrect + (isCorrect ? 1 : 0);
    const newPromotions = sessionPromotions + (result.wasPromoted ? 1 : 0);
    const newDemotions = sessionDemotions + (result.wasDemoted ? 1 : 0);

    setSessionCount(newCount);
    setSessionCorrect(newCorrect);
    setSessionPromotions(newPromotions);
    setSessionDemotions(newDemotions);

    await refreshStats();

    // Check if batch milestone reached
    if (batchSize !== 'continuous' && newCount % batchSize === 0) {
      const timeSpentMs = Date.now() - sessionStartTime.current;
      setMilestoneStats({
        totalAnswered: newCount,
        correctCount: newCorrect,
        accuracy: Math.round((newCorrect / newCount) * 100),
        promotions: newPromotions,
        demotions: newDemotions,
        timeSpentMs,
      });
    }
  };

  // Keyboard shortcut handlers
  useKeyboardShortcuts({
    enabled: !isLoading && !milestoneStats,
    onSelectOption: (idx) => {
      if (!showFeedback && shuffledChoices[idx]) {
        handleSelectChoice(shuffledChoices[idx].id);
      }
    },
    onAdvance: () => {
      if (showFeedback) {
        loadNextQuestion();
      }
    },
  });

  const handleKeepGoing = () => {
    setMilestoneStats(null);
    sessionStartTime.current = Date.now();
    loadNextQuestion();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header & Settings Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Study Session</h2>
            <p className="text-xs text-slate-500">
              {batchSize === 'continuous'
                ? `Continuous Mode • ${sessionCount} Answered`
                : `Batch Progress: ${sessionCount % batchSize} / ${batchSize}`}
            </p>
          </div>
        </div>

        {/* Focus Preset & Batch Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {focusPresets.map((p) => (
              <button
                key={p.id}
                onClick={() => setFocusPreset(p.id)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ${
                  focusPreset === p.id
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Batch size selector */}
          <div className="flex items-center text-xs bg-slate-100 p-1 rounded-xl">
            {batchOptions.map((sz) => (
              <button
                key={String(sz)}
                onClick={() => setBatchSize(sz)}
                className={`px-2 py-1.5 rounded-lg font-semibold transition ${
                  batchSize === sz
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {sz === 'continuous' ? '∞' : sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar for Batches */}
      {batchSize !== 'continuous' && (
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${((sessionCount % batchSize) / batchSize) * 100}%` }}
          />
        </div>
      )}

      {/* Main Study Card */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm font-medium">Drawing next question...</p>
        </div>
      ) : currentQuestion ? (
        <StudyCard
          question={currentQuestion}
          shuffledChoices={shuffledChoices}
          selectedChoiceId={selectedChoiceId}
          showFeedback={showFeedback}
          transitionResult={transitionResult}
          currentBucket={currentBucket}
          onSelectChoice={handleSelectChoice}
          onAdvance={loadNextQuestion}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">All questions in this pool studied!</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You've completed every question in this filter. Switch focus preset or start a mock exam to test your readiness.
          </p>
          <button
            onClick={() => setFocusPreset('balanced')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
          >
            Reset Focus to Balanced
          </button>
        </div>
      )}

      {/* Milestone Modal */}
      {milestoneStats && (
        <MilestoneModal
          stats={milestoneStats}
          onKeepGoing={handleKeepGoing}
          onExit={onBackToDashboard}
        />
      )}
    </div>
  );
};
