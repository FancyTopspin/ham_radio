import type { Choice, Question } from '../types';

export interface DisplayedChoice extends Choice {
  displayLetter: 'A' | 'B' | 'C' | 'D';
}

const LETTERS: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

/**
 * Smart option shuffler adhering to FCC exam pool rules:
 * 1. If shuffle_disabled is True (e.g. cross-letter references like 'Both A and B'), keep original order.
 * 2. If a choice is flagged is_pinned_bottom ('All of the above' / 'None of the above'),
 *    shuffle the other 3 and anchor the pinned choice to position D.
 * 3. Otherwise, randomize all 4 options.
 */
export function getSmartShuffledChoices(question: Question): DisplayedChoice[] {
  const choices = [...question.choices];
  if (choices.length === 0) return [];

  // If shuffle disabled, preserve original letter order
  if (question.shuffle_disabled) {
    return choices
      .sort((a, b) => a.original_letter.localeCompare(b.original_letter))
      .map((c, i) => ({ ...c, displayLetter: LETTERS[i] || 'A' }));
  }

  const pinned = choices.filter(c => c.is_pinned_bottom);
  const unpinned = choices.filter(c => !c.is_pinned_bottom);

  // Fisher-Yates shuffle on unpinned
  for (let i = unpinned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unpinned[i], unpinned[j]] = [unpinned[j], unpinned[i]];
  }

  // Combine: unpinned first, pinned anchored at bottom
  const finalOrdered = [...unpinned, ...pinned];

  return finalOrdered.map((c, idx) => ({
    ...c,
    displayLetter: LETTERS[idx] || 'A',
  }));
}
