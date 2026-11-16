import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LicenseClassType, StudyFocusPreset, SessionBatchSize, AttemptEvent } from '../types';
import { db } from '../db';
import { hydratePoolQuestions } from '../db/hydration';
import { fetchAuthStatus, logoutUser, type User } from '../services/authService';
import {
  getUnsyncedCount,
  pushUnsyncedAttempts,
  fetchCloudAttempts,
  mergeCloudHistory,
} from '../services/syncService';
import { AuthModal } from '../components/AuthModal';
import { ConflictModal } from '../components/ConflictModal';

interface BucketCounts {
  unseen: number;
  needs_work: number;
  learning: number;
  mastered: number;
  total: number;
  mistakesCount: number;
}

interface SyncState {
  isSyncing: boolean;
  unsyncedCount: number;
  lastSyncedAt: Date | null;
  error: string | null;
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
  // Auth
  currentUser: User | null;
  openAuthModal: () => void;
  logout: () => Promise<void>;
  // Sync
  syncState: SyncState;
  triggerManualSync: () => Promise<void>;
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

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync State
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    unsyncedCount: 0,
    lastSyncedAt: null,
    error: null,
  });

  // Conflict Resolution State
  const [conflictState, setConflictState] = useState<{
    isOpen: boolean;
    localCount: number;
    cloudAttempts: AttemptEvent[];
  }>({
    isOpen: false,
    localCount: 0,
    cloudAttempts: [],
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

    // Also update unsynced count
    const unsynced = await getUnsyncedCount();
    setSyncState(prev => ({ ...prev, unsyncedCount: unsynced }));
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

  // Initial Pool Hydration
  useEffect(() => {
    triggerHydration();
  }, [triggerHydration]);

  // Check Auth Status on mount
  useEffect(() => {
    fetchAuthStatus().then(auth => {
      if (auth.authenticated && auth.user) {
        setCurrentUser(auth.user);
      }
    });
  }, []);

  // Perform Manual Sync
  const triggerManualSync = useCallback(async () => {
    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      const result = await pushUnsyncedAttempts();
      const remainingUnsynced = await getUnsyncedCount();
      setSyncState({
        isSyncing: false,
        unsyncedCount: remainingUnsynced,
        lastSyncedAt: new Date(),
        error: result.error || null,
      });
      await refreshStats();
    } catch (err: unknown) {
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Sync failed',
      }));
    }
  }, [refreshStats]);

  // Background auto-sync interval (every 3 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      const unsynced = await getUnsyncedCount();
      if (unsynced > 0) {
        await triggerManualSync();
      }
    }, 180000); // 3 minutes

    return () => clearInterval(interval);
  }, [triggerManualSync]);

  // Handle Login Post-Processing & Conflict Check
  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    const localCount = await db.attempts.count();
    const cloudAttempts = await fetchCloudAttempts();

    if (localCount > 0 && cloudAttempts.length > 0) {
      // Both exist -> prompt conflict resolution
      setConflictState({
        isOpen: true,
        localCount,
        cloudAttempts,
      });
    } else if (localCount > 0 && cloudAttempts.length === 0) {
      // Brand new account with local guest history -> push local history automatically
      await pushUnsyncedAttempts();
      await refreshStats();
    } else if (localCount === 0 && cloudAttempts.length > 0) {
      // Cloud account on a fresh device -> download cloud history
      await mergeCloudHistory(cloudAttempts);
      await refreshStats();
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const handleConflictResolved = async () => {
    setConflictState({ isOpen: false, localCount: 0, cloudAttempts: [] });
    await refreshStats();
  };

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
        currentUser,
        openAuthModal: () => setIsAuthModalOpen(true),
        logout: handleLogout,
        syncState,
        triggerManualSync,
      }}
    >
      {children}

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Account Linking Conflict Modal */}
      <ConflictModal
        isOpen={conflictState.isOpen}
        localCount={conflictState.localCount}
        cloudAttempts={conflictState.cloudAttempts}
        onResolved={handleConflictResolved}
      />
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
