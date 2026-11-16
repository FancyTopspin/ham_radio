import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { DisplayedChoice } from '../engine/shuffler';

interface ChoiceButtonProps {
  choice: DisplayedChoice;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showFeedback: boolean;
  disabled: boolean;
  onSelect: () => void;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  choice,
  index,
  isSelected,
  isCorrect,
  showFeedback,
  disabled,
  onSelect,
}) => {
  const keyboardHint = index + 1; // 1, 2, 3, 4

  let buttonClasses = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start space-x-3 cursor-pointer select-none ";

  if (showFeedback) {
    if (isCorrect) {
      buttonClasses += "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ";
    } else if (isSelected && !isCorrect) {
      buttonClasses += "bg-rose-50 border-rose-500 text-rose-950 shadow-xs ";
    } else {
      buttonClasses += "bg-white border-slate-200 text-slate-400 opacity-60 ";
    }
  } else {
    if (isSelected) {
      buttonClasses += "bg-blue-50 border-blue-600 text-blue-950 ring-2 ring-blue-500/20 ";
    } else {
      buttonClasses += "bg-white border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-slate-50 ";
    }
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={buttonClasses}
    >
      {/* Letter badge + Keyboard shortcut indicator */}
      <div className="flex flex-col items-center flex-shrink-0">
        <span
          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
            showFeedback && isCorrect
              ? 'bg-emerald-600 text-white'
              : showFeedback && isSelected && !isCorrect
              ? 'bg-rose-600 text-white'
              : isSelected
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {choice.displayLetter}
        </span>
        <span className="text-[10px] text-slate-400 font-mono mt-1">[{keyboardHint}]</span>
      </div>

      {/* Choice Text */}
      <div className="flex-1 pt-0.5 text-sm sm:text-base leading-relaxed">
        {choice.choice_text}
      </div>

      {/* Feedback Icon */}
      {showFeedback && isCorrect && (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
      )}
      {showFeedback && isSelected && !isCorrect && (
        <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-1" />
      )}
    </button>
  );
};
