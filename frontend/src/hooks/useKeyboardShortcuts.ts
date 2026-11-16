import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onSelectOption?: (index: number) => void;
  onAdvance?: () => void;
  onToggleMark?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSelectOption,
  onAdvance,
  onToggleMark,
  enabled = true,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Number keys 1-4
      if (['1', '2', '3', '4'].includes(key) && onSelectOption) {
        e.preventDefault();
        onSelectOption(parseInt(key, 10) - 1);
        return;
      }

      // Letter keys a-d
      if (['a', 'b', 'c', 'd'].includes(key) && onSelectOption) {
        const mapping: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
        e.preventDefault();
        onSelectOption(mapping[key]);
        return;
      }

      // Space or Enter to advance
      if ((e.code === 'Space' || e.key === 'Enter') && onAdvance) {
        e.preventDefault();
        onAdvance();
        return;
      }

      // Key 'm' for mark / review
      if (key === 'm' && onToggleMark) {
        e.preventDefault();
        onToggleMark();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onSelectOption, onAdvance, onToggleMark]);
}
