import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  LayoutList,
  Square,
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Question, StudyDisplayMode, TopicLessonInfo } from '../types';
import { getTopicQuestions } from '../engine/topicEngine';
import { StudyQuestionCard } from '../components/StudyQuestionCard';

interface TopicStudyViewProps {
  topic?: TopicLessonInfo | null;
  subElementCode?: string;
  subElementTitle?: string;
  onBackToTopics: () => void;
  onStartPractice: (topic?: TopicLessonInfo | null) => void;
}

export const TopicStudyView: React.FC<TopicStudyViewProps> = ({
  topic,
  subElementCode,
  subElementTitle,
  onBackToTopics,
  onStartPractice,
}) => {
  const { activeClass } = useApp();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState<StudyDisplayMode>('list');
  const [isLoading, setIsLoading] = useState(true);

  // Load questions for topic
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      const subGroup = topic ? topic.subGroupCode : undefined;
      const seCode = !subGroup ? subElementCode : undefined;

      const loaded = await getTopicQuestions(activeClass, subGroup, seCode);
      if (isMounted) {
        setQuestions(loaded);
        setCurrentIndex(0);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [activeClass, topic, subElementCode]);

  // Keyboard navigation for card view
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (displayMode !== 'card' || questions.length === 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
    },
    [displayMode, questions.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const title = topic
    ? `Lesson ${topic.lessonNumber}: ${topic.subGroupCode} — ${topic.title}`
    : subElementCode
    ? `SubElement ${subElementCode} — ${subElementTitle || 'Commission Pool'}`
    : 'Study Questions';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header & Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <button
            onClick={onBackToTopics}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0 mt-0.5"
            title="Back to Topics Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <span>Read & Study Mode</span>
              <span>•</span>
              <span className="text-slate-500">{questions.length} Questions</span>
            </div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
              {title}
            </h2>
          </div>
        </div>

        {/* View Toggle & Practice Action */}
        <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
          {/* Display Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setDisplayMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                displayMode === 'list'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="View all questions in a scrollable list"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Full List</span>
            </button>
            <button
              onClick={() => setDisplayMode('card')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                displayMode === 'card'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Step through one question at a time"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Card by Card</span>
            </button>
          </div>

          {/* Quick Switch to Interactive Practice Quiz */}
          <button
            onClick={() => onStartPractice(topic)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Practice Quiz</span>
          </button>
        </div>
      </div>

      {/* Mode Instructions Pill */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Read Mode Active:</strong> Correct answers are pre-highlighted in green with comprehensive explanations shown below.
          </span>
        </div>
        <span className="hidden sm:inline text-emerald-700 font-medium">
          Ready to test yourself? Click "Practice Quiz" above
        </span>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm font-medium">Loading questions and explanations...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No questions found in this topic</h3>
          <p className="text-xs text-slate-500">
            Please make sure the active pool is hydrated.
          </p>
        </div>
      ) : displayMode === 'list' ? (
        /* Full Scrollable List View */
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <StudyQuestionCard
              key={q.id}
              question={q}
              index={idx}
              total={questions.length}
            />
          ))}

          {/* Bottom Practice Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl border border-blue-900/50 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h4 className="font-bold text-base flex items-center justify-center sm:justify-start space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Finished reviewing this lesson?</span>
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Take the interactive practice quiz to verify your retention and earn mastery points!
              </p>
            </div>
            <button
              onClick={() => onStartPractice(topic)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer shrink-0"
            >
              Start Practice Quiz →
            </button>
          </div>
        </div>
      ) : (
        /* Card-by-Card View */
        <div className="space-y-4">
          {/* Question Index Pills / Step Progress */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`p-2 rounded-lg transition ${
                currentIndex === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Quick jump dots or count */}
            <div className="flex items-center space-x-1.5 overflow-x-auto max-w-[65vw] px-2 py-1">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition shrink-0 ${
                    currentIndex === idx
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
              disabled={currentIndex === questions.length - 1}
              className={`p-2 rounded-lg transition ${
                currentIndex === questions.length - 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Current Question */}
          {questions[currentIndex] && (
            <StudyQuestionCard
              question={questions[currentIndex]}
              index={currentIndex}
              total={questions.length}
            />
          )}

          {/* Card View Bottom Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                currentIndex === 0
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={() => onStartPractice(topic)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <span>Take Practice Quiz</span>
                <Play className="w-3.5 h-3.5 fill-current ml-1" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
