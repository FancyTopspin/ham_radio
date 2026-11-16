import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LicenseClassType, StudyFocusPreset, SessionBatchSize } from '../types';
import { db } from '../db';
import { hydratePoolQuestions } from '../db/hydration';

interface BucketCounts {
  unseen: number;
  needs_work: number;
  learning: number;
  mastered: number;
  total: number;
  mistakesCount: number;
}

interface AppContextType {
  activeClass: LicenseClassType;
  setActiveClass: (cls: LicenseClassType) => void;
  focusPreset: StudyFocusPreset;
  setFocusPreset: (preset: StudyFocusPreset) => void;
  batchSize: SessionBatchSize;
  setBatchSize: (size: SessionBatchSize) => void;
  isHydrating: boolean;
  bucketCounts: BucketCounts;
  refreshStats: () => Promise<void>;
  forceRefreshPool: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeClass, setActiveClassState] = useState<LicenseClassType>(() => {
    const saved = localStorage.getItem('ham_active_class');
    return (saved as LicenseClassType) || 'TECH';
  });

  const [focusPreset, setFocusPresetState] = useState<StudyFocusPreset>(() => {
    const saved = localStorage.getItem('ham_focus_preset');
    return (saved as StudyFocusPreset) || 'balanced';
  });

  const [batchSize, setBatchSizeState] = useState<SessionBatchSize>(() => {
    const saved = localStorage.getItem('ham_batch_size');
    if (saved === 'continuous') return 'continuous';
    const num = parseInt(saved || '25', 10);
    return ([10, 25, 50].includes(num) ? num : 25) as SessionBatchSize;
  });

  const [isHydrating, setIsHydrating] = useState(false);
  const [bucketCounts, setBucketCounts] = useState<BucketCounts>({
    unseen: 0,
    needs_work: 0,
    learning: 0,
    mastered: 0,
    total: 0,
    mistakesCount: 0,
  });

  const setActiveClass = (cls: LicenseClassType) => {
    setActiveClassState(cls);
    localStorage.setItem('ham_active_class', cls);
  };

  const setFocusPreset = (preset: StudyFocusPreset) => {
    setFocusPresetState(preset);
    localStorage.setItem('ham_focus_preset', preset);
  };

  const setBatchSize = (size: SessionBatchSize) => {
    setBatchSizeState(size);
    localStorage.setItem('ham_batch_size', String(size));
  };

  const refreshStats = useCallback(async () => {
    const states = await db.question_states.where('class_type').equals(activeClass).toArray();
    let unseen = 0;
    let needs_work = 0;
    let learning = 0;
    let mastered = 0;
    let mistakesCount = 0;

    for (const s of states) {
      if (s.bucket === 'unseen') unseen++;
      else if (s.bucket === 'needs_work') needs_work++;
      else if (s.bucket === 'learning') learning++;
      else if (s.bucket === 'mastered') mastered++;

      if (s.in_mistakes_queue) mistakesCount++;
    }

    setBucketCounts({
      unseen,
      needs_work,
      learning,
      mastered,
      total: states.length,
      mistakesCount,
    });
  }, [activeClass]);

  const triggerHydration = useCallback(async (force = false) => {
    setIsHydrating(true);
    try {
      await hydratePoolQuestions(activeClass, force);
      await refreshStats();
    } catch (err) {
      console.error('Hydration error:', err);
    } finally {
      setIsHydrating(false);
    }
  }, [activeClass, refreshStats]);

  useEffect(() => {
    triggerHydration();
  }, [triggerHydration]);

  return (
    <AppContext.Provider
      value={{
        activeClass,
        setActiveClass,
        focusPreset,
        setFocusPreset,
        batchSize,
        setBatchSize,
        isHydrating,
        bucketCounts,
        refreshStats,
        forceRefreshPool: () => triggerHydration(true),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
