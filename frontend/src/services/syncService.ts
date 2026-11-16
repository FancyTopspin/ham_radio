import { db } from '../db';
import type { AttemptEvent, QuestionState } from '../types';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  unsyncedCount: number;
  error: string | null;
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem('ham_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + crypto.randomUUID();
    localStorage.setItem('ham_device_id', deviceId);
  }
  return deviceId;
}

export async function getUnsyncedCount(): Promise<number> {
  try {
    return await db.attempts.filter(a => !a.synced).count();
  } catch (err) {
    console.error('Failed to get unsynced count:', err);
    return 0;
  }
}

/**
 * Pushes unsynced local attempts to the server.
 */
export async function pushUnsyncedAttempts(): Promise<{ syncedCount: number; error?: string }> {
  const unsynced = await db.attempts.filter(a => !a.synced).toArray();
  if (unsynced.length === 0) {
    return { syncedCount: 0 };
  }

  // Look up question codes if any are missing
  const questionIds = unsynced.filter(a => !a.question_code).map(a => a.question_id);
  const questionsMap = new Map<string, string>();
  if (questionIds.length > 0) {
    const questions = await db.questions.where('id').anyOf(questionIds).toArray();
    for (const q of questions) {
      questionsMap.set(q.id, q.question_code);
    }
  }

  const payloadAttempts = unsynced.map(a => ({
    id: a.id,
    question_id: a.question_id,
    question_code: a.question_code || questionsMap.get(a.question_id) || '',
    selected_choice_id: a.selected_choice_id,
    is_correct: a.is_correct,
    mode: a.mode,
    duration_ms: a.duration_ms,
    created_at: a.created_at,
  }));

  try {
    const res = await fetch('/api/study/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        device_id: getDeviceId(),
        attempts: payloadAttempts,
      }),
    });

    if (!res.ok) {
      throw new Error(`Sync failed with HTTP ${res.status}`);
    }

    // Mark as synced in Dexie
    await db.transaction('rw', db.attempts, async () => {
      for (const a of unsynced) {
        await db.attempts.update(a.id, { synced: true });
      }
    });

    return { syncedCount: unsynced.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    console.error('Error during push sync:', message);
    return { syncedCount: 0, error: message };
  }
}

/**
 * Fetches user attempts stored on the cloud.
 */
export async function fetchCloudAttempts(since?: string): Promise<AttemptEvent[]> {
  try {
    const url = since ? `/api/study/attempts?since=${encodeURIComponent(since)}` : '/api/study/attempts';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return (data.attempts || []).map((a: any) => ({
      ...a,
      synced: true,
    }));
  } catch (err) {
    console.error('Error fetching cloud attempts:', err);
    return [];
  }
}

/**
 * Replays a list of attempts chronologically to recalculate QuestionState buckets.
 */
export async function recalculateQuestionStatesFromAttempts(): Promise<void> {
  const allAttempts = await db.attempts.orderBy('created_at').toArray();
  const allQuestions = await db.questions.toArray();

  // Initialize fresh states for all known questions
  const states = new Map<string, QuestionState>();
  for (const q of allQuestions) {
    states.set(q.id, {
      question_id: q.id,
      class_type: q.class_type,
      bucket: 'unseen',
      consecutive_correct: 0,
      last_attempt_at: null,
      in_mistakes_queue: false,
      mistake_consecutive_correct: 0,
    });
  }

  // Replay attempts
  for (const a of allAttempts) {
    const state = states.get(a.question_id);
    if (!state) continue;

    const oldBucket = state.bucket;
    const isCorrect = a.is_correct;
    const attemptTime = new Date(a.created_at).getTime();

    if (isCorrect) {
      state.consecutive_correct += 1;
      if (state.consecutive_correct >= 2) {
        if (oldBucket === 'unseen' || oldBucket === 'needs_work') {
          state.bucket = 'learning';
          state.consecutive_correct = 0;
        } else if (oldBucket === 'learning') {
          state.bucket = 'mastered';
          state.consecutive_correct = 2;
        }
      } else if (oldBucket === 'unseen') {
        state.bucket = 'learning';
      }

      if (a.mode === 'mistake_drill' || state.in_mistakes_queue) {
        state.mistake_consecutive_correct += 1;
        if (state.mistake_consecutive_correct >= 2) {
          state.in_mistakes_queue = false;
          state.mistake_consecutive_correct = 0;
        }
      }
    } else {
      state.consecutive_correct = 0;
      if (oldBucket === 'mastered') {
        state.bucket = 'learning';
      } else {
        state.bucket = 'needs_work';
      }
      state.in_mistakes_queue = true;
      state.mistake_consecutive_correct = 0;
    }

    state.last_attempt_at = attemptTime;
  }

  // Bulk put updated states
  const updatedList = Array.from(states.values());
  await db.transaction('rw', db.question_states, async () => {
    await db.question_states.bulkPut(updatedList);
  });
}

/**
 * Merge Cloud Strategy:
 * Pushes unsynced local attempts to cloud, downloads all cloud attempts,
 * adds any missing cloud attempts locally, and recalculates states.
 */
export async function mergeCloudHistory(cloudAttempts: AttemptEvent[]): Promise<void> {
  // First push local unsynced attempts
  await pushUnsyncedAttempts();

  // Add all cloud attempts to Dexie (bulkPut avoids primary key collisions)
  await db.transaction('rw', db.attempts, async () => {
    for (const ca of cloudAttempts) {
      await db.attempts.put({
        ...ca,
        synced: true,
      });
    }
  });

  // Replay states
  await recalculateQuestionStatesFromAttempts();
}

/**
 * Overwrite Local Strategy:
 * Clears local attempts, inserts cloud attempts, and recalculates states.
 */
export async function overwriteLocalWithCloud(cloudAttempts: AttemptEvent[]): Promise<void> {
  await db.transaction('rw', db.attempts, async () => {
    await db.attempts.clear();
    for (const ca of cloudAttempts) {
      await db.attempts.add({
        ...ca,
        synced: true,
      });
    }
  });

  await recalculateQuestionStatesFromAttempts();
}
