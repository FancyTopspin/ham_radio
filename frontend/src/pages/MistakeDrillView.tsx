import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Question, StudyBucket } from '../types';
import { db } from '../db';
import { recordAttempt, type TransitionResult } from '../engine/studyEngine';
import { getSmartShuffledChoices, type DisplayedChoice } from '../engine/shuffler';
import { StudyCard } from '../components/StudyCard';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface MistakeDrillViewProps {
  onBackToDashboard: () => void;
}

export const MistakeDrillView: React.FC<MistakeDrillViewProps> = ({ onBackToDashboard }) => {
  const { activeClass, refreshStats, bucketCounts } = useApp();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [shuffledChoices, setShuffledChoices] = useState<DisplayedChoice[]>([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentBucket, setCurrentBucket] = useState<StudyBucket>('needs_work');
  const [transitionResult, setTransitionResult] = useState<TransitionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [consecutiveInDrill, setConsecutiveInDrill] = useState(0);

  const questionStartTime = useRef<number>(Date.now());

  // Load all mistakes in queue
  const loadMistakeQueue = useCallback(async () => {
    setIsLoading(true);
    const mistakeStates = await db.question_states
      .where('class_type').equals(activeClass)
      .filter((s) => s.in_mistakes_queue)
      .toArray();

    if (mistakeStates.length === 0) {
      setCurrentQuestion(null);
      setIsLoading(false);
      return;
    }

    const questionIds = mistakeStates.map((s) => s.question_id);
    const questions = await db.questions.where('id').anyOf(questionIds).toArray();
    // Pick a random question from the queue
    const picked = questions[Math.floor(Math.random() * questions.length)];
    if (picked) {
      setCurrentQuestion(picked);
      setShuffledChoices(getSmartShuffledChoices(picked));
      setSelectedChoiceId(null);
      setShowFeedback(false);
      setTransitionResult(null);

      const state = mistakeStates.find((s) => s.question_id === picked.id);
      setCurrentBucket(state ? state.bucket : 'needs_work');
      setConsecutiveInDrill(state ? state.mistake_consecutive_correct : 0);
      questionStartTime.current = Date.now();
    }
    setIsLoading(false);
  }, [activeClass]);

  useEffect(() => {
    loadMistakeQueue();
  }, [loadMistakeQueue]);

  const handleSelectChoice = async (choiceId: string) => {
    if (showFeedback || !currentQuestion) return;

    const durationMs = Date.now() - questionStartTime.current;
    const isCorrect = choiceId === currentQuestion.correct_choice_id;

    setSelectedChoiceId(choiceId);
    setShowFeedback(true);

    const result = await recordAttempt(currentQuestion, choiceId, isCorrect, durationMs, 'mistake_drill');
    setTransitionResult(result);
    setCurrentBucket(result.newBucket);

    const state = await db.question_states.get(currentQuestion.id);
    setConsecutiveInDrill(state ? state.mistake_consecutive_correct : 0);

    await refreshStats();
  };

  const handleAdvance = () => {
    loadMistakeQueue();
  };

  useKeyboardShortcuts({
    enabled: !isLoading && currentQuestion !== null,
    onSelectOption: (idx) => {
      if (!showFeedback && shuffledChoices[idx]) {
        handleSelectChoice(shuffledChoices[idx].id);
      }
    },
    onAdvance: () => {
      if (showFeedback) {
        handleAdvance();
      }
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-rose-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Drill My Mistakes</span>
            </h2>
            <p className="text-xs text-slate-500">
              Targeting weak spots • Requires 2 consecutive correct answers to clear
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            {bucketCounts.mistakesCount} in Queue
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-600" />
          <p className="text-sm font-medium">Scanning mistakes queue...</p>
        </div>
      ) : currentQuestion ? (
        <div className="space-y-3">
          {/* Progress towards clearing current question */}
          <div className="flex items-center justify-between text-xs px-2 text-slate-600">
            <span>Rescue Progress:</span>
            <span className="font-bold font-mono">
              {consecutiveInDrill} of 2 Correct Strikes to Clear
            </span>
          </div>

          <StudyCard
            question={currentQuestion}
            shuffledChoices={shuffledChoices}
            selectedChoiceId={selectedChoiceId}
            showFeedback={showFeedback}
            transitionResult={transitionResult}
            currentBucket={currentBucket}
            onSelectChoice={handleSelectChoice}
            onAdvance={handleAdvance}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-emerald-200 p-12 text-center space-y-4 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Mistakes Queue Clean!</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You have resolved all missed questions for the {activeClass} pool! Any future missed questions from study sessions or mock exams will automatically show up here.
          </p>
          <div className="pt-2">
            <button
              onClick={onBackToDashboard}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
