import React from 'react';
import { CheckCircle2, MessageSquare, ExternalLink, Lightbulb, Image as ImageIcon } from 'lucide-react';
import type { Question } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useApp } from '../context/AppContext';

interface StudyQuestionCardProps {
  question: Question;
  index?: number;
  total?: number;
  className?: string;
}

export const StudyQuestionCard: React.FC<StudyQuestionCardProps> = ({
  question,
  index,
  total,
  className = '',
}) => {
  const { openFeedbackModal } = useApp();

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
            {question.question_code}
          </span>
          {question.fcc_citation && (
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md hidden xs:inline">
              FCC {question.fcc_citation}
            </span>
          )}
        </div>

        <button
          onClick={() =>
            openFeedbackModal({
              category: 'question_issue',
              questionCode: question.question_code,
            })
          }
          className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-md transition cursor-pointer"
          title={`Report an issue with ${question.question_code}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Report Issue</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Question Text */}
        <div className="text-slate-900 text-base sm:text-lg font-medium leading-relaxed">
          {question.question_text}
        </div>

        {/* Optional Diagram / Schematic Figure */}
        {question.has_diagram && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>{question.diagram_figure_name || 'Schematic Diagram'}</span>
            </div>
            {question.diagram_image_url ? (
              <img
                src={question.diagram_image_url}
                alt={question.diagram_figure_name}
                className="max-h-64 object-contain rounded-lg border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="text-xs text-slate-400 italic">
                Refer to diagram {question.diagram_figure_name} in official exam booklet
              </div>
            )}
          </div>
        )}

        {/* Choices with Correct Answer Pre-Highlighted */}
        <div className="space-y-2.5 pt-1">
          {question.choices.map((choice) => {
            const isCorrect =
              choice.is_correct || choice.id === question.correct_choice_id;

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
        {question.explanation && (
          <div className="mt-4 pt-4 border-t border-slate-200/80">
            <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-blue-900 font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center space-x-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Explanation & Key Concepts</span>
                </div>
                {question.explanation.is_admin_verified && (
                  <span className="text-[10px] text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded font-semibold border border-blue-200">
                    Verified
                  </span>
                )}
              </div>

              <div className="text-sm sm:text-base text-slate-800 leading-relaxed">
                <MarkdownRenderer content={question.explanation.explanation_markdown} />
              </div>

              {question.explanation.fcc_citation_url && (
                <div className="pt-2 border-t border-blue-200/50 flex items-center justify-end">
                  <a
                    href={question.explanation.fcc_citation_url}
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
