import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, TrendingDown, HelpCircle, MessageSquarePlus, Edit3 } from 'lucide-react';
import type { Question, StudyBucket } from '../types';
import type { DisplayedChoice } from '../engine/shuffler';
import type { TransitionResult } from '../engine/studyEngine';
import { ChoiceButton } from './ChoiceButton';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useApp } from '../context/AppContext';
import { AdminQuestionEditor } from './AdminQuestionEditor';

interface StudyCardProps {
  question: Question;
  shuffledChoices: DisplayedChoice[];
  selectedChoiceId: string | null;
  showFeedback: boolean;
  transitionResult: TransitionResult | null;
  currentBucket: StudyBucket;
  onSelectChoice: (choiceId: string) => void;
  onAdvance: () => void;
}

const BUCKET_LABELS: Record<StudyBucket, { label: string; color: string }> = {
  unseen: { label: 'Unseen', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  needs_work: { label: 'Needs Work', color: 'bg-rose-100 text-rose-700 border-rose-300' },
  learning: { label: 'Learning', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  mastered: { label: 'Mastered', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

export const StudyCard: React.FC<StudyCardProps> = ({
  question,
  shuffledChoices,
  selectedChoiceId,
  showFeedback,
  transitionResult,
  currentBucket,
  onSelectChoice,
  onAdvance,
}) => {
  const { openFeedbackModal, currentUser } = useApp();
  const isAdmin = !!(currentUser?.is_staff || currentUser?.is_superuser);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(question);

  useEffect(() => {
    setCurrentQuestion(question);
  }, [question]);

  const bucketInfo = BUCKET_LABELS[currentBucket] || BUCKET_LABELS.unseen;

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <AdminQuestionEditor
          question={currentQuestion}
          onSave={(updated) => {
            setCurrentQuestion(updated);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Question Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-base text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
            {currentQuestion.question_code}
          </span>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-200 text-slate-700">
            Group {currentQuestion.sub_group_code}
          </span>
          {currentQuestion.fcc_citation && (
            <span className="text-xs font-mono px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              [{currentQuestion.fcc_citation}]
            </span>
          )}
        </div>

        {/* Bucket Status Badge & Admin / Feedback Triggers */}
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center space-x-1 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition font-semibold cursor-pointer shadow-2xs"
              title="Edit Question & Explanation"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Edit (Admin)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openFeedbackModal({ category: 'question_issue', questionCode: currentQuestion.question_code })}
            className="inline-flex items-center space-x-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg border border-transparent hover:border-amber-200 transition text-xs cursor-pointer"
            title="Report an issue or suggest an improvement for this question"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Feedback</span>
          </button>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${bucketInfo.color}`}>
            {bucketInfo.label}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Question Text */}
        <div className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed">
          {currentQuestion.question_text}
        </div>

        {/* Diagram Callout if present */}
        {currentQuestion.has_diagram && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <div className="flex items-center space-x-2 font-semibold text-sm">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Diagram Reference: {currentQuestion.diagram_figure_name || 'Refer to Exam Figure'}</span>
            </div>
            {currentQuestion.diagram_image_url ? (
              <img
                src={currentQuestion.diagram_image_url}
                alt={currentQuestion.diagram_figure_name}
                className="mt-3 max-h-64 rounded-lg border border-amber-200 mx-auto"
              />
            ) : (
              <p className="text-xs text-amber-700 mt-1">
                (Schematic diagram image pending admin upload)
              </p>
            )}
          </div>
        )}

        {/* Choices List */}
        <div className="space-y-3">
          {shuffledChoices.map((choice, idx) => {
            const rawChoice = currentQuestion.choices?.find(c => c.id === choice.id);
            const updatedChoice: DisplayedChoice = rawChoice
              ? { ...rawChoice, displayLetter: choice.displayLetter }
              : choice;
            return (
              <ChoiceButton
                key={choice.id}
                choice={updatedChoice}
                index={idx}
                isSelected={selectedChoiceId === choice.id}
                isCorrect={choice.id === currentQuestion.correct_choice_id}
                showFeedback={showFeedback}
                disabled={showFeedback}
                onSelect={() => onSelectChoice(choice.id)}
              />
            );
          })}
        </div>

        {/* Instant Feedback Reveal in Study Mode */}
        {showFeedback && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
            {/* Transition Alert */}
            {transitionResult && (
              <div className="flex items-center space-x-2">
                {transitionResult.wasPromoted && (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Promoted to {transitionResult.newBucket.toUpperCase()}!</span>
                  </div>
                )}
                {transitionResult.wasDemoted && (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Moved to {transitionResult.newBucket.toUpperCase()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Explanation Box */}
            {currentQuestion.explanation && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm space-y-2 text-slate-800">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Explanation & Rule Citation</span>
                    {currentQuestion.explanation.is_admin_verified && (
                      <span className="text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                        Admin Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center space-x-1 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition font-semibold cursor-pointer shadow-2xs"
                        title="Edit Explanation"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-600" />
                        <span>Edit</span>
                      </button>
                    )}
                    {currentQuestion.explanation.fcc_citation_url && (
                      <a
                        href={currentQuestion.explanation.fcc_citation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-semibold"
                      >
                        <span>Read Rule on eCFR</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <MarkdownRenderer content={currentQuestion.explanation.explanation_markdown} />
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>Is this explanation clear and helpful?</span>
                  <button
                    type="button"
                    onClick={() => openFeedbackModal({ category: 'question_issue', questionCode: currentQuestion.question_code })}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Suggest Improvement / Report Error</span>
                  </button>
                </div>
              </div>
            )}

            {/* Next Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onAdvance}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Next Question</span>
                <span className="text-xs bg-blue-500/40 px-2 py-0.5 rounded font-mono">Space</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
