import { db } from '../db';
import { getSmartShuffledChoices } from './shuffler';
import { recordAttempt } from './studyEngine';
import type { LicenseClassType, Question, Choice, Explanation } from '../types';

export interface DailyChallengeQuestion {
  question: Question;
  choices: Choice[];
  explanation?: Explanation;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  isCompletedToday: boolean;
  todayScore?: { score: number; total: number };
}

// Simple deterministic hash for seed
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Seeded pseudorandom generator
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStreakInfo(classType: LicenseClassType): StreakInfo {
  const today = getTodayDateString();
  const storedStreak = parseInt(localStorage.getItem('ham_streak_days') || '0', 10);
  const storedLongest = parseInt(localStorage.getItem('ham_longest_streak') || '0', 10);
  const lastDate = localStorage.getItem('ham_last_streak_date');

  const todayKey = `ham_daily_${classType}_${today}`;
  const todayRecordStr = localStorage.getItem(todayKey);
  let isCompletedToday = false;
  let todayScore: { score: number; total: number } | undefined;

  if (todayRecordStr) {
    try {
      const parsed = JSON.parse(todayRecordStr);
      isCompletedToday = !!parsed.completed;
      todayScore = { score: parsed.score, total: parsed.total };
    } catch {
      // ignore
    }
  }

  // Check if streak was broken (missed yesterday and today)
  let activeStreak = storedStreak;
  const yesterday = getYesterdayDateString();
  if (lastDate && lastDate !== today && lastDate !== yesterday) {
    activeStreak = 0;
  }

  return {
    currentStreak: activeStreak,
    longestStreak: Math.max(storedLongest, activeStreak),
    lastCompletedDate: lastDate,
    isCompletedToday,
    todayScore,
  };
}

/**
 * Deterministically generates today's 5 daily challenge questions
 */
export async function generateDailyChallenge(classType: LicenseClassType): Promise<DailyChallengeQuestion[]> {
  const today = getTodayDateString();
  const seedString = `${today}_${classType}_challenge_v1`;
  const seed = simpleHash(seedString);
  const rand = seededRandom(seed);

  const allQuestions = await db.questions.where('class_type').equals(classType).toArray();
  if (allQuestions.length === 0) return [];

  // Group questions by sub_element_code (e.g. T1, T2, etc.)
  const subelementMap = new Map<string, Question[]>();
  for (const q of allQuestions) {
    const sub = q.sub_element_code || 'ALL';
    if (!subelementMap.has(sub)) {
      subelementMap.set(sub, []);
    }
    subelementMap.get(sub)!.push(q);
  }

  const subelementCodes = Array.from(subelementMap.keys());
  
  // Deterministic shuffle of subelements
  const shuffledSubs = [...subelementCodes];
  for (let i = shuffledSubs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffledSubs[i], shuffledSubs[j]] = [shuffledSubs[j], shuffledSubs[i]];
  }

  const selectedQuestions: Question[] = [];
  const targetCount = Math.min(5, allQuestions.length);

  for (let i = 0; i < targetCount; i++) {
    const subCode = shuffledSubs[i % shuffledSubs.length];
    const pool = subelementMap.get(subCode) || allQuestions;
    const pickIndex = Math.floor(rand() * pool.length);
    selectedQuestions.push(pool[pickIndex]);
  }

  // Hydrate choices and explanations
  const results: DailyChallengeQuestion[] = [];
  for (const q of selectedQuestions) {
    const choices = await db.choices.where('question_id').equals(q.id).toArray();
    const explanation = await db.explanations.get(q.id);
    const shuffled = getSmartShuffledChoices({ ...q, choices });
    results.push({
      question: q,
      choices: shuffled,
      explanation,
    });
  }

  return results;
}

/**
 * Records completion of the daily challenge, updates streaks, Dexie attempt states, and backend sync
 */
export async function submitDailyChallengeCompletion(
  classType: LicenseClassType,
  answers: { questionId: string; selectedChoiceId: string; isCorrect: boolean }[]
): Promise<{ streak: number; xpEarned: number; totalXp: number }> {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const storedStreak = parseInt(localStorage.getItem('ham_streak_days') || '0', 10);
  const storedLongest = parseInt(localStorage.getItem('ham_longest_streak') || '0', 10);
  const lastDate = localStorage.getItem('ham_last_streak_date');

  let newStreak = 1;
  if (lastDate === yesterday) {
    newStreak = storedStreak + 1;
  } else if (lastDate === today) {
    newStreak = storedStreak;
  }

  const newLongest = Math.max(storedLongest, newStreak);
  localStorage.setItem('ham_streak_days', String(newStreak));
  localStorage.setItem('ham_longest_streak', String(newLongest));
  localStorage.setItem('ham_last_streak_date', today);

  const score = answers.filter(a => a.isCorrect).length;
  const total = answers.length;
  const xpEarned = (score * 10) + (newStreak * 5) + 20; // 10 XP per right answer + streak bonus + 20 completion

  // Save local daily record
  const todayKey = `ham_daily_${classType}_${today}`;
  localStorage.setItem(
    todayKey,
    JSON.stringify({
      completed: true,
      score,
      total,
      xpEarned,
      timestamp: new Date().toISOString(),
    })
  );

  // Record attempts in Dexie and update QuestionState
  for (const ans of answers) {
    const q = await db.questions.get(ans.questionId);
    if (q) {
      await recordAttempt(q, ans.selectedChoiceId, ans.isCorrect, 0, 'daily_challenge');
    }
  }

  // Get device ID
  let deviceId = localStorage.getItem('ham_device_id') || '';

  // Submit to backend
  let totalXp = xpEarned;
  try {
    const res = await fetch('/api/study/daily-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        device_id: deviceId,
        class_type: classType,
        challenge_date: today,
        score,
        total,
        streak_count: newStreak,
        xp_earned: xpEarned,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      totalXp = data.total_xp || xpEarned;
    }
  } catch (err) {
    console.error('Failed to submit daily challenge to server:', err);
  }

  return {
    streak: newStreak,
    xpEarned,
    totalXp,
  };
}
