import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  Award,
  Sparkles,
  Star,
  Check,
  Loader2,
  Send,
} from 'lucide-react';
import type { FeedbackCategory, FeedbackPreset } from '../types';
import { getDeviceId } from '../services/syncService';
import { useApp } from '../context/AppContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset?: FeedbackPreset | null;
}

const CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}[] = [
  {
    id: 'general',
    label: 'General Feedback',
    icon: MessageSquare,
    placeholder: 'What do you like, or what could we improve about Ham Radio Prep?',
  },
  {
    id: 'question_issue',
    label: 'Question / Explanation Issue',
    icon: AlertCircle,
    placeholder: 'Found a typo, incorrect answer, or want to suggest a clearer explanation?',
  },
  {
    id: 'feature_request',
    label: 'Feature Idea',
    icon: Lightbulb,
    placeholder: 'What feature or tool would make your amateur radio study easier?',
  },
  {
    id: 'exam_experience',
    label: 'Mock Exam Feedback',
    icon: Award,
    placeholder: 'How realistic did the mock exam feel compared to your expectations or test session?',
  },
  {
    id: 'passed_exam',
    label: 'I Passed My Exam! 🎉',
    icon: Sparkles,
    placeholder: 'Congratulations! Which license class did you pass? How was the test and what helped you most?',
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  preset,
}) => {
  const { currentUser } = useApp();

  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [questionCode, setQuestionCode] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever modal opens or preset changes
  useEffect(() => {
    if (isOpen) {
      setCategory(preset?.category || 'general');
      setQuestionCode(preset?.questionCode || '');
      setRating(null);
      setMessage('');
      setEmail(currentUser?.email || '');
      setIsSubmitting(false);
      setSubmitSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, preset, currentUser]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCategoryObj =
    CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Please enter a feedback message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          question_code: questionCode.trim().toUpperCase(),
          rating,
          message: message.trim(),
          email: email.trim(),
          device_id: getDeviceId(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit feedback';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 id="feedback-modal-title" className="font-bold text-slate-900 text-base">
                Share Your Feedback
              </h3>
              <p className="text-xs text-slate-500">
                Help improve Ham Radio Prep for the amateur radio community
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close feedback dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submitSuccess ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-extrabold text-slate-900">
                73! Feedback Received
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                Thank you for your thoughts and support. Your input directly helps other test candidates master their FCC licenses!
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            {errorMessage && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Category Selector Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Question Code (if reporting a question) */}
            {(category === 'question_issue' || questionCode) && (
              <div className="space-y-1 bg-amber-50/60 border border-amber-200/80 p-3 rounded-2xl">
                <label className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>Question Code (Optional)</span>
                  {questionCode && (
                    <button
                      type="button"
                      onClick={() => setQuestionCode('')}
                      className="text-[10px] text-amber-700 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  value={questionCode}
                  onChange={(e) => setQuestionCode(e.target.value.toUpperCase())}
                  placeholder="e.g. T1A02, G2B04, E5A01"
                  className="w-full text-xs font-mono font-bold px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Rating Stars (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Experience Rating (Optional)
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(rating === star ? null : star)}
                    className="p-1 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                    aria-label={`${star} star rating`}
                  >
                    <Star
                      className={`w-6 h-6 transition ${
                        (hoverRating !== null ? star <= hoverRating : star <= (rating || 0))
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                {rating && (
                  <span className="text-xs font-medium text-slate-500 ml-2">
                    {rating} of 5
                  </span>
                )}
              </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Your Feedback
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={currentCategoryObj.placeholder}
                rows={4}
                required
                className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Optional Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Email Address (Optional)</span>
                <span className="text-[10px] text-slate-400 normal-case font-normal">
                  Only if you would like a reply
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="callsign@example.com"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
