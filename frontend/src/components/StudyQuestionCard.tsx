import React, { useState, useEffect } from 'react';
import { CheckCircle2, MessageSquare, ExternalLink, Lightbulb, Image as ImageIcon, Edit3, Check } from 'lucide-react';
import type { Question } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useApp } from '../context/AppContext';
import { AdminQuestionEditor } from './AdminQuestionEditor';

interface StudyQuestionCardProps {
  question: Question;
  index?: number;
  total?: number;
  className?: string;
  onQuestionUpdated?: (updated: Question) => void;
}

export const StudyQuestionCard: React.FC<StudyQuestionCardProps> = ({
  question,
  index,
  total,
  className = '',
  onQuestionUpdated,
}) => {
  const { openFeedbackModal, currentUser } = useApp();
  const isAdmin = !!(currentUser?.is_staff || currentUser?.is_superuser);

  const [currentQuestion, setCurrentQuestion] = useState<Question>(question);
  const [isEditing, setIsEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setCurrentQuestion(question);
  }, [question]);

  const handleSaved = (updated: Question) => {
    setCurrentQuestion(updated);
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 4000);
    onQuestionUpdated?.(updated);
  };

  if (isEditing) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
        <AdminQuestionEditor
          question={currentQuestion}
          onSave={handleSaved}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:shadow-md ${className}`}
    >
      {/* Question Header */}
      <div className="bg-slate-50/90 border-b border-slate-200/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {index !== undefined && total !== undefined && (
            <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
              #{index + 1} of {total}
            </span>
          )}
          <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
            {currentQuestion.question_code}
          </span>
          {currentQuestion.fcc_citation && (
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md hidden xs:inline">
              FCC {currentQuestion.fcc_citation}
            </span>
          )}
          {justSaved && (
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md animate-fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved!</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center space-x-1 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition font-semibold cursor-pointer shadow-2xs"
              title={`Edit question ${currentQuestion.question_code} and explanation`}
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Edit (Admin)</span>
            </button>
          )}

          <button
            onClick={() =>
              openFeedbackModal({
                category: 'question_issue',
                questionCode: currentQuestion.question_code,
              })
            }
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-md transition cursor-pointer"
            title={`Report an issue with ${currentQuestion.question_code}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report Issue</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Question Text */}
        <div className="text-slate-900 text-base sm:text-lg font-medium leading-relaxed">
          {currentQuestion.question_text}
        </div>

        {/* Optional Diagram / Schematic Figure */}
        {currentQuestion.has_diagram && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>{currentQuestion.diagram_figure_name || 'Schematic Diagram'}</span>
            </div>
            {currentQuestion.diagram_image_url ? (
              <img
                src={currentQuestion.diagram_image_url}
                alt={currentQuestion.diagram_figure_name}
                className="max-h-64 object-contain rounded-lg border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="text-xs text-slate-400 italic">
                Refer to diagram {currentQuestion.diagram_figure_name} in official exam booklet
              </div>
            )}
          </div>
        )}

        {/* Choices with Correct Answer Pre-Highlighted */}
        <div className="space-y-2.5 pt-1">
          {currentQuestion.choices.map((choice) => {
            const isCorrect =
              choice.is_correct || choice.id === currentQuestion.correct_choice_id;

            return (
              <div
                key={choice.id}
                className={`flex items-start justify-between p-3.5 rounded-xl border transition ${
                  isCorrect
                    ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-medium shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 opacity-80'
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCorrect
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {choice.original_letter}
                  </span>
                  <span className="text-sm sm:text-base leading-snug pt-0.5">
                    {choice.choice_text}
                  </span>
                </div>

                {isCorrect && (
                  <span className="shrink-0 ml-3 inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Correct Answer</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Explanation Section (Shown directly underneath) */}
        {currentQuestion.explanation && (
          <div className="mt-4 pt-4 border-t border-slate-200/80">
            <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-blue-900 font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center space-x-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Explanation & Key Concepts</span>
                </div>
                <div className="flex items-center space-x-2">
                  {currentQuestion.explanation.is_admin_verified && (
                    <span className="text-[10px] text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded font-semibold border border-blue-200">
                      Verified
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 hover:bg-indigo-50 px-2 py-0.5 rounded transition flex items-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3 text-indigo-600" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-sm sm:text-base text-slate-800 leading-relaxed">
                <MarkdownRenderer content={currentQuestion.explanation.explanation_markdown} />
              </div>

              {currentQuestion.explanation.fcc_citation_url && (
                <div className="pt-2 border-t border-blue-200/50 flex items-center justify-end">
                  <a
                    href={currentQuestion.explanation.fcc_citation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-900 font-medium"
                  >
                    <span>View FCC eCFR Part 97 Rule</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
