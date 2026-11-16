import React from 'react';
import { ExternalLink, Sparkles, TrendingDown, HelpCircle } from 'lucide-react';
import type { Question, StudyBucket } from '../types';
import type { DisplayedChoice } from '../engine/shuffler';
import type { TransitionResult } from '../engine/studyEngine';
import { ChoiceButton } from './ChoiceButton';

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
  const bucketInfo = BUCKET_LABELS[currentBucket] || BUCKET_LABELS.unseen;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Question Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-base text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
            {question.question_code}
          </span>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-200 text-slate-700">
            Group {question.sub_group_code}
          </span>
          {question.fcc_citation && (
            <span className="text-xs font-mono px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              [{question.fcc_citation}]
            </span>
          )}
        </div>

        {/* Bucket Status Badge */}
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${bucketInfo.color}`}>
            {bucketInfo.label}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Question Text */}
        <div className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed">
          {question.question_text}
        </div>

        {/* Diagram Callout if present */}
        {question.has_diagram && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <div className="flex items-center space-x-2 font-semibold text-sm">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Diagram Reference: {question.diagram_figure_name || 'Refer to Exam Figure'}</span>
            </div>
            {question.diagram_image_url ? (
              <img
                src={question.diagram_image_url}
                alt={question.diagram_figure_name}
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
          {shuffledChoices.map((choice, idx) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              index={idx}
              isSelected={selectedChoiceId === choice.id}
              isCorrect={choice.id === question.correct_choice_id}
              showFeedback={showFeedback}
              disabled={showFeedback}
              onSelect={() => onSelectChoice(choice.id)}
            />
          ))}
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
            {question.explanation && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm space-y-2 text-slate-800">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Explanation & Rule Citation</span>
                  {question.explanation.fcc_citation_url && (
                    <a
                      href={question.explanation.fcc_citation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-semibold"
                    >
                      <span>Read Rule on eCFR</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="prose prose-sm text-slate-700 max-w-none whitespace-pre-line">
                  {question.explanation.explanation_markdown}
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
