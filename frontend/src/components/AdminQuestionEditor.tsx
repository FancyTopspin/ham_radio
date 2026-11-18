import React, { useState } from 'react';
import { Save, X, Eye, Edit3, AlertCircle, ExternalLink } from 'lucide-react';
import type { Question, Choice } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { db } from '../db';

interface AdminQuestionEditorProps {
  question: Question;
  onSave: (updatedQuestion: Question) => void;
  onCancel: () => void;
}

export const AdminQuestionEditor: React.FC<AdminQuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
}) => {
  const [questionText, setQuestionText] = useState(question.question_text);
  const [fccCitation, setFccCitation] = useState(question.fcc_citation || '');
  
  // Clone choices and find correct choice
  const [choices, setChoices] = useState<Choice[]>(() => {
    return (question.choices || []).map(c => ({
      ...c,
      is_correct: c.id === question.correct_choice_id,
    }));
  });

  const [correctLetter, setCorrectLetter] = useState<'A' | 'B' | 'C' | 'D'>(() => {
    const correct = (question.choices || []).find(c => c.id === question.correct_choice_id);
    return correct ? correct.original_letter : 'A';
  });

  const [explanationMarkdown, setExplanationMarkdown] = useState(
    question.explanation?.explanation_markdown || ''
  );
  const [fccCitationUrl, setFccCitationUrl] = useState(
    question.explanation?.fcc_citation_url || ''
  );
  const [isAdminVerified, setIsAdminVerified] = useState(
    question.explanation?.is_admin_verified ?? true
  );

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChoiceTextChange = (id: string, text: string) => {
    setChoices(prev => prev.map(c => (c.id === id ? { ...c, choice_text: text } : c)));
  };

  const handleSelectCorrect = (letter: 'A' | 'B' | 'C' | 'D') => {
    setCorrectLetter(letter);
    setChoices(prev =>
      prev.map(c => ({
        ...c,
        is_correct: c.original_letter === letter,
      }))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setError('Question text cannot be empty.');
      return;
    }
    if (!explanationMarkdown.trim()) {
      setError('Explanation markdown cannot be empty.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        question_text: questionText.trim(),
        fcc_citation: fccCitation.trim(),
        choices: choices.map(c => ({
          id: c.id,
          choice_text: c.choice_text.trim(),
          is_correct: c.original_letter === correctLetter,
        })),
        correct_letter: correctLetter,
        explanation_markdown: explanationMarkdown.trim(),
        fcc_citation_url: fccCitationUrl.trim(),
        is_admin_verified: isAdminVerified,
      };

      const res = await fetch(`/api/questions/questions/${question.id}/admin-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.detail || `Save failed with status ${res.status}`);
      }

      // Update Local IndexedDB (Dexie) so local state updates immediately without rehydration
      await db.transaction('rw', [db.questions, db.choices, db.explanations], async () => {
        const correctChoice = choices.find(c => c.original_letter === correctLetter);
        await db.questions.update(question.id, {
          question_text: questionText.trim(),
          fcc_citation: fccCitation.trim(),
          correct_choice_id: correctChoice?.id,
        });

        const choicesToPut = choices.map(c => ({
          ...c,
          question_id: question.id,
          choice_text: c.choice_text.trim(),
          is_correct: c.original_letter === correctLetter,
        }));
        await db.choices.bulkPut(choicesToPut);

        await db.explanations.put({
          question_id: question.id,
          explanation_markdown: explanationMarkdown.trim(),
          fcc_citation_url: fccCitationUrl.trim(),
          is_admin_verified: isAdminVerified,
        });
      });

      const updatedQuestion: Question = {
        ...question,
        question_text: questionText.trim(),
        fcc_citation: fccCitation.trim(),
        choices: choices.map(c => ({
          ...c,
          choice_text: c.choice_text.trim(),
          is_correct: c.original_letter === correctLetter,
        })),
        correct_choice_id: choices.find(c => c.original_letter === correctLetter)?.id,
        explanation: {
          explanation_markdown: explanationMarkdown.trim(),
          fcc_citation_url: fccCitationUrl.trim(),
          is_admin_verified: isAdminVerified,
        },
      };

      onSave(updatedQuestion);
    } catch (err: any) {
      console.error('Failed to save question edit:', err);
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-4 sm:p-6 bg-slate-900/5 rounded-2xl border-2 border-indigo-400 space-y-5">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-indigo-200/80 pb-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-sm bg-indigo-600 text-white px-2.5 py-0.5 rounded-md">
            {question.question_code}
          </span>
          <span className="text-xs font-semibold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
            Admin Inline Editor
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Question Text */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Question Text
        </label>
        <textarea
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          rows={3}
          className="w-full text-sm sm:text-base font-medium p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          placeholder="Enter question text..."
          required
        />
      </div>

      {/* FCC Citation */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          FCC Rule Citation (Optional)
        </label>
        <input
          type="text"
          value={fccCitation}
          onChange={e => setFccCitation(e.target.value)}
          placeholder="e.g. [97.301(a)]"
          className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Choices Editor */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Choices & Correct Answer
        </label>
        <div className="space-y-2.5">
          {choices.map(choice => {
            const isCorrect = choice.original_letter === correctLetter;
            return (
              <div
                key={choice.id}
                className={`flex items-center space-x-2 sm:space-x-3 p-2.5 rounded-xl border transition ${
                  isCorrect
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectCorrect(choice.original_letter)}
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCorrect
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-emerald-100'
                  }`}
                  title="Click to mark as correct answer"
                >
                  {choice.original_letter}
                </button>
                <input
                  type="text"
                  value={choice.choice_text}
                  onChange={e => handleChoiceTextChange(choice.id, e.target.value)}
                  className="grow text-xs sm:text-sm font-medium p-1.5 bg-transparent border-0 focus:outline-hidden focus:ring-1 focus:ring-indigo-400 rounded-md"
                  placeholder={`Choice ${choice.original_letter} text...`}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleSelectCorrect(choice.original_letter)}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-md shrink-0 transition ${
                    isCorrect
                      ? 'text-emerald-800 bg-emerald-200/80 font-bold'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {isCorrect ? '✓ Correct' : 'Set Correct'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation Section */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Explanation (Markdown & LaTeX formulas)
          </label>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                activeTab === 'edit' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                activeTab === 'preview' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {activeTab === 'edit' ? (
          <div>
            <textarea
              value={explanationMarkdown}
              onChange={e => setExplanationMarkdown(e.target.value)}
              rows={6}
              className="w-full text-xs sm:text-sm font-mono p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              placeholder="Enter explanation in Markdown... (Use $...$ for math, e.g. $E = I \times R$)"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports bold (`**`), bullet points (`-`), and KaTeX LaTeX formulas (`$E = I \times R$`).
            </p>
          </div>
        ) : (
          <div className="p-4 bg-white border border-slate-200 rounded-xl min-h-[140px] text-sm text-slate-800">
            {explanationMarkdown ? (
              <MarkdownRenderer content={explanationMarkdown} />
            ) : (
              <p className="text-slate-400 italic">No explanation content to preview.</p>
            )}
          </div>
        )}
      </div>

      {/* FCC Citation URL & Verified Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            FCC eCFR Part 97 Link
          </label>
          <div className="relative">
            <input
              type="url"
              value={fccCitationUrl}
              onChange={e => setFccCitationUrl(e.target.value)}
              placeholder="https://www.ecfr.gov/..."
              className="w-full text-xs p-2.5 pr-8 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            {fccCitationUrl && (
              <a
                href={fccCitationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-blue-600"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center pt-2 sm:pt-6">
          <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAdminVerified}
              onChange={e => setIsAdminVerified(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span>Mark as Admin Verified</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center space-x-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
