import React from 'react';
import type { ExamQuestionState } from '../engine/examEngine';

interface QuestionNavigatorProps {
  questions: ExamQuestionState[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  onSelectIndex,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
        <span>Question Navigator</span>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            <span>Answered</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Marked</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 max-h-56 overflow-y-auto p-1">
        {questions.map((item, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = item.selectedChoiceId !== null;
          const isMarked = item.isMarkedForReview;

          let btnClass = "relative h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center cursor-pointer ";

          if (isCurrent) {
            btnClass += "ring-2 ring-blue-600 bg-blue-50 text-blue-900 border border-blue-400 font-extrabold ";
          } else if (isAnswered) {
            btnClass += "bg-slate-900 text-white hover:bg-slate-800 ";
          } else {
            btnClass += "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 ";
          }

          return (
            <button
              key={item.question.id}
              onClick={() => onSelectIndex(idx)}
              className={btnClass}
              title={`Question ${idx + 1}: ${item.question.question_code}`}
            >
              <span>{idx + 1}</span>
              {isMarked && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
