import { db } from '../db';
import type { LicenseClassType, Question } from '../types';
import { getSmartShuffledChoices, type DisplayedChoice } from './shuffler';

export interface ExamQuestionState {
  question: Question;
  shuffledChoices: DisplayedChoice[];
  selectedChoiceId: string | null;
  isMarkedForReview: boolean;
}

export interface ExamResult {
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  subElementBreakdown: Record<string, { total: number; correct: number }>;
}

export interface ExamBlueprint {
  quota: number;
  passingScore: number;
  timeLimitSeconds: number; // 45m = 2700s, 60m = 3600s
}

export const EXAM_BLUEPRINTS: Record<LicenseClassType, ExamBlueprint> = {
  TECH: { quota: 35, passingScore: 26, timeLimitSeconds: 45 * 60 },
  GEN: { quota: 35, passingScore: 26, timeLimitSeconds: 45 * 60 },
  EXTRA: { quota: 50, passingScore: 37, timeLimitSeconds: 60 * 60 },
};

/**
 * Generates an official FCC blueprint mock exam:
 * Selects exactly 1 question chosen at random from every sub-element group in the active pool.
 */
export async function generateMockExam(classType: LicenseClassType): Promise<ExamQuestionState[]> {
  const allQuestions = await db.questions.where('class_type').equals(classType).toArray();
  if (allQuestions.length === 0) return [];

  // Group questions by sub_group_code (e.g. T1A, T1B, etc.)
  const groupMap: Record<string, Question[]> = {};
  for (const q of allQuestions) {
    const groupKey = q.sub_group_code || q.question_code.slice(0, 3);
    if (!groupMap[groupKey]) {
      groupMap[groupKey] = [];
    }
    groupMap[groupKey].push(q);
  }

  // Sort groups alphabetically (e.g. T1A, T1B, T1C ... T0C)
  const sortedGroupKeys = Object.keys(groupMap).sort();
  const selectedQuestions: Question[] = [];

  for (const gKey of sortedGroupKeys) {
    const candidates = groupMap[gKey];
    if (candidates && candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      selectedQuestions.push(chosen);
    }
  }

  // Shuffle question choices for each exam question
  return selectedQuestions.map(q => ({
    question: q,
    shuffledChoices: getSmartShuffledChoices(q),
    selectedChoiceId: null,
    isMarkedForReview: false,
  }));
}

/**
 * Grades the mock exam and produces a detailed sub-element score report.
 */
export function gradeMockExam(
  examQuestions: ExamQuestionState[],
  classType: LicenseClassType,
  timeSpentSeconds: number
): ExamResult {
  const blueprint = EXAM_BLUEPRINTS[classType];
  let correctCount = 0;
  const subElementBreakdown: Record<string, { total: number; correct: number }> = {};

  for (const item of examQuestions) {
    const isCorrect = item.selectedChoiceId === item.question.correct_choice_id;
    if (isCorrect) correctCount++;

    const se = item.question.sub_element_code || item.question.question_code.slice(0, 2);
    if (!subElementBreakdown[se]) {
      subElementBreakdown[se] = { total: 0, correct: 0 };
    }
    subElementBreakdown[se].total += 1;
    if (isCorrect) {
      subElementBreakdown[se].correct += 1;
    }
  }

  const scorePercentage = Math.round((correctCount / examQuestions.length) * 100);
  const isPassed = correctCount >= blueprint.passingScore;

  return {
    totalQuestions: examQuestions.length,
    correctCount,
    scorePercentage,
    isPassed,
    timeSpentSeconds,
    subElementBreakdown,
  };
}
