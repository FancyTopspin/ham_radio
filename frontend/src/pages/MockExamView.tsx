import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Award, XCircle, Bookmark, ArrowLeft, ArrowRight,
  RotateCcw, HelpCircle, Check, BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  generateMockExam,
  gradeMockExam,
  EXAM_BLUEPRINTS,
  type ExamQuestionState,
  type ExamResult,
} from '../engine/examEngine';
import { recordAttempt } from '../engine/studyEngine';
import { MockExamTimer } from '../components/MockExamTimer';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { ChoiceButton } from '../components/ChoiceButton';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface MockExamViewProps {
  onBackToDashboard: () => void;
}

export const MockExamView: React.FC<MockExamViewProps> = ({ onBackToDashboard }) => {
  const { activeClass, refreshStats, openFeedbackModal } = useApp();
  const blueprint = EXAM_BLUEPRINTS[activeClass];

  const [examStarted, setExamStarted] = useState(false);
  const [examQuestions, setExamQuestions] = useState<ExamQuestionState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const startTimeRef = useRef<number>(Date.now());

  // Generate exam questions
  const startExam = async () => {
    const questions = await generateMockExam(activeClass);
    if (questions.length === 0) return;

    setExamQuestions(questions);
    setCurrentIndex(0);
    setIsSubmitted(false);
    setExamResult(null);
    setReviewMode(false);
    startTimeRef.current = Date.now();
    setExamStarted(true);
  };

  const handleSelectChoice = (choiceId: string) => {
    if (isSubmitted) return;

    setExamQuestions((prev) => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        selectedChoiceId: choiceId,
      };
      return updated;
    });
  };

  const toggleMarkForReview = () => {
    setExamQuestions((prev) => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        isMarkedForReview: !updated[currentIndex].isMarkedForReview,
      };
      return updated;
    });
  };

  const handleTimeExpired = () => {
    if (!isSubmitted) {
      finalizeExam();
    }
  };

  const finalizeExam = async () => {
    setShowSubmitModal(false);
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    const result = gradeMockExam(examQuestions, activeClass, durationSeconds);
    setExamResult(result);
    setIsSubmitted(true);

    if (result.isPassed) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    }

    // Record attempts in database & update question states
    for (const item of examQuestions) {
      if (item.selectedChoiceId) {
        const isCorrect = item.selectedChoiceId === item.question.correct_choice_id;
        await recordAttempt(item.question, item.selectedChoiceId, isCorrect, 0, 'mock_exam');
      }
    }
    await refreshStats();
  };

  // Keyboard navigation
  useKeyboardShortcuts({
    enabled: examStarted && !isSubmitted && !showSubmitModal,
    onSelectOption: (idx) => {
      const current = examQuestions[currentIndex];
      if (current && current.shuffledChoices[idx]) {
        handleSelectChoice(current.shuffledChoices[idx].id);
      }
    },
    onToggleMark: toggleMarkForReview,
    onAdvance: () => {
      if (currentIndex < examQuestions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    },
  });

  const currentItem = examQuestions[currentIndex];
  const answeredCount = examQuestions.filter((q) => q.selectedChoiceId !== null).length;
  const unansweredCount = examQuestions.length - answeredCount;

  // 1. Initial Briefing Screen
  if (!examStarted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center border border-purple-200 shadow-sm">
          <Award className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Official Simulation
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
            {activeClass} Class License Examination
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Standard FCC Volunteer Examiner (VE) Blueprint Test
          </p>
        </div>

        {/* Blueprint Specs Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left space-y-3 shadow-xs">
          <div className="flex justify-between py-1 border-b border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Question Quota:</span>
            <span className="font-bold text-slate-900">{blueprint.quota} Questions (1 per group)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Passing Threshold:</span>
            <span className="font-bold text-emerald-600">{blueprint.passingScore} of {blueprint.quota} (74%)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Session Time Limit:</span>
            <span className="font-bold text-slate-900">{blueprint.timeLimitSeconds / 60} Minutes</span>
          </div>
          <div className="flex justify-between py-1 text-sm">
            <span className="text-slate-500 font-medium">Feedback Mode:</span>
            <span className="font-bold text-slate-900">Withheld until Submission</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={startExam}
            className="w-full sm:w-auto px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            Start Official Exam
          </button>
          <button
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // 2. Post-Exam Scorecard View
  if (isSubmitted && examResult && !reviewMode) {
    const minutes = Math.floor(examResult.timeSpentSeconds / 60);
    const seconds = examResult.timeSpentSeconds % 60;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Pass / Fail Banner */}
        <div
          className={`p-8 rounded-3xl text-center space-y-3 border shadow-sm ${
            examResult.isPassed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div
            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl ${
              examResult.isPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {examResult.isPassed ? <Check className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <h2 className="text-3xl font-extrabold">
            {examResult.isPassed ? 'Congratulations! You Passed!' : 'Exam Incomplete'}
          </h2>

          <p className="text-sm font-medium">
            {examResult.isPassed
              ? `You scored ${examResult.correctCount} / ${examResult.totalQuestions} (${examResult.scorePercentage}%). You have met the FCC pass requirement!`
              : `You scored ${examResult.correctCount} / ${examResult.totalQuestions} (${examResult.scorePercentage}%). Minimum required to pass: ${blueprint.passingScore} questions.`}
          </p>

          <div className="text-xs text-slate-500 font-mono">
            Time Taken: {minutes}m {seconds}s
          </div>
        </div>

        {/* Sub-element Breakdown Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900">Syllabus Sub-element Score Breakdown</h3>
          <div className="divide-y divide-slate-100">
            {Object.entries(examResult.subElementBreakdown).map(([se, stats]) => {
              const pct = Math.round((stats.correct / stats.total) * 100);
              const sePassed = pct >= 74;
              return (
                <div key={se} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="font-mono font-bold text-slate-700">Sub-element {se}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-500 text-xs">
                      {stats.correct} / {stats.total} correct
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        sePassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setReviewMode(true)}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Review All Questions</span>
          </button>
          <button
            onClick={startExam}
            className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Another Exam</span>
          </button>
          <button
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
          >
            Dashboard
          </button>
        </div>

        {/* Post-Exam Feedback Prompt */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left mt-2">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-800">
              {examResult.isPassed ? 'Ready for test day? Share your thoughts!' : 'How did this mock exam feel?'}
            </span>
            <p className="text-[11px] text-slate-500">
              Your feedback on question difficulty and realism helps us improve the exam engine.
            </p>
          </div>
          <button
            onClick={() => openFeedbackModal({
              category: examResult.isPassed ? 'passed_exam' : 'exam_experience',
            })}
            className="shrink-0 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            Leave Exam Feedback
          </button>
        </div>
      </div>
    );
  }

  // 3. Active Exam & Review Interface
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Exam Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-slate-900 text-lg">
            {reviewMode ? 'Exam Review' : `Question ${currentIndex + 1} of ${examQuestions.length}`}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            ({answeredCount} of {examQuestions.length} answered)
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {!reviewMode && (
            <MockExamTimer
              initialSeconds={blueprint.timeLimitSeconds}
              isPaused={false}
              onTimeExpired={handleTimeExpired}
            />
          )}

          {!reviewMode ? (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={() => setReviewMode(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
            >
              Back to Scorecard
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left 3 Cols: Question Area */}
        <div className="lg:col-span-3 space-y-6">
          {currentItem && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              
              {/* Question Metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md">
                    {currentItem.question.question_code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
                    Group {currentItem.question.sub_group_code}
                  </span>
                </div>

                {!reviewMode && (
                  <button
                    onClick={toggleMarkForReview}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      currentItem.isMarkedForReview
                        ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{currentItem.isMarkedForReview ? 'Marked' : 'Mark for Review [M]'}</span>
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed">
                {currentItem.question.question_text}
              </div>

              {/* Diagram Figure Callout if present */}
              {currentItem.question.has_diagram && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <div className="flex items-center space-x-2 font-semibold text-sm">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Diagram Reference: {currentItem.question.diagram_figure_name}</span>
                  </div>
                  {currentItem.question.diagram_image_url && (
                    <img
                      src={currentItem.question.diagram_image_url}
                      alt={currentItem.question.diagram_figure_name}
                      className="mt-3 max-h-64 rounded-lg border border-amber-200 mx-auto"
                    />
                  )}
                </div>
              )}

              {/* Choices */}
              <div className="space-y-3">
                {currentItem.shuffledChoices.map((choice, idx) => (
                  <ChoiceButton
                    key={choice.id}
                    choice={choice}
                    index={idx}
                    isSelected={currentItem.selectedChoiceId === choice.id}
                    isCorrect={choice.id === currentItem.question.correct_choice_id}
                    showFeedback={reviewMode}
                    disabled={reviewMode}
                    onSelect={() => handleSelectChoice(choice.id)}
                  />
                ))}
              </div>

              {/* Post-Submission Review Explanation */}
              {reviewMode && currentItem.question.explanation && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm space-y-2 text-slate-800">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-2">Explanation & Rule Analysis:</div>
                  <MarkdownRenderer content={currentItem.question.explanation.explanation_markdown} />
                </div>
              )}

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold rounded-xl text-sm flex items-center space-x-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                  disabled={currentIndex === examQuestions.length - 1}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm flex items-center space-x-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Right Col: Question Grid Navigator */}
        <div className="lg:col-span-1">
          <QuestionNavigator
            questions={examQuestions}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
          />
        </div>

      </div>

      {/* Confirmation Modal Before Submission */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-5 animate-in zoom-in-95">
            <div className="mx-auto w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Ready to Submit Exam?</h3>

            {unansweredCount > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                ⚠ You still have <strong>{unansweredCount} unanswered</strong> questions! Any unanswered questions will be marked incorrect.
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                All {examQuestions.length} questions have been answered. You will receive your official score report immediately.
              </p>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={finalizeExam}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Yes, Submit Exam
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
              >
                Return to Test
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
