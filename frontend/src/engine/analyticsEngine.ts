import { db } from '../db';
import type { LicenseClassType, StudyBucket } from '../types';

export interface SubelementStat {
  code: string;
  total: number;
  mastered: number;
  learning: number;
  needsWork: number;
  unseen: number;
  masteryPercentage: number;
}

export interface ExamHistoryPoint {
  date: string;
  score: number;
  total: number;
  percentage: number;
  isPassed: boolean;
}

export interface AnalyticsSummary {
  readinessScore: number;
  passProbability: 'High' | 'Moderate' | 'Needs Practice' | 'Not Ready';
  totalQuestions: number;
  bucketDistribution: { name: string; value: number; color: string }[];
  subelements: SubelementStat[];
  examHistory: ExamHistoryPoint[];
  studyStreakDays: number;
  totalAttempts: number;
  totalCorrect: number;
  overallAccuracy: number;
  weakestSubelements: SubelementStat[];
}

export async function computeClassAnalytics(classType: LicenseClassType): Promise<AnalyticsSummary> {
  const allQuestions = await db.questions.where('class_type').equals(classType).toArray();
  const allStates = await db.question_states.where('class_type').equals(classType).toArray();
  const allAttempts = await db.attempts.toArray();

  const totalQuestions = allQuestions.length || 1;

  // 1. Bucket counts & Readiness Score
  let unseen = 0;
  let needsWork = 0;
  let learning = 0;
  let mastered = 0;

  for (const s of allStates) {
    if (s.bucket === 'unseen') unseen++;
    else if (s.bucket === 'needs_work') needsWork++;
    else if (s.bucket === 'learning') learning++;
    else if (s.bucket === 'mastered') mastered++;
  }

  // Readiness Formula
  const weightedPoints = (mastered * 1.0) + (learning * 0.6) + (needsWork * 0.2);
  const readinessScore = Math.min(100, Math.round((weightedPoints / totalQuestions) * 100));

  let passProbability: 'High' | 'Moderate' | 'Needs Practice' | 'Not Ready';
  if (readinessScore >= 80) passProbability = 'High';
  else if (readinessScore >= 65) passProbability = 'Moderate';
  else if (readinessScore >= 45) passProbability = 'Needs Practice';
  else passProbability = 'Not Ready';

  // 2. Bucket Distribution for Donut Chart
  const bucketDistribution = [
    { name: 'Mastered', value: mastered, color: '#10b981' }, // emerald-500
    { name: 'Learning', value: learning, color: '#f59e0b' }, // amber-500
    { name: 'Needs Work', value: needsWork, color: '#f43f5e' }, // rose-500
    { name: 'Unseen', value: unseen, color: '#94a3b8' }, // slate-400
  ];

  // 3. Sub-element Breakdown
  const seMap: Record<string, { total: number; mastered: number; learning: number; needsWork: number; unseen: number }> = {};
  const stateByQId = new Map(allStates.map(s => [s.question_id, s]));

  for (const q of allQuestions) {
    const se = q.sub_element_code || q.question_code.slice(0, 2);
    if (!seMap[se]) {
      seMap[se] = { total: 0, mastered: 0, learning: 0, needsWork: 0, unseen: 0 };
    }
    seMap[se].total += 1;
    const st = stateByQId.get(q.id);
    const b: StudyBucket = st ? st.bucket : 'unseen';
    if (b === 'mastered') seMap[se].mastered += 1;
    else if (b === 'learning') seMap[se].learning += 1;
    else if (b === 'needs_work') seMap[se].needsWork += 1;
    else seMap[se].unseen += 1;
  }

  const subelements: SubelementStat[] = Object.entries(seMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, data]) => {
      const pts = (data.mastered * 1.0) + (data.learning * 0.6) + (data.needsWork * 0.2);
      const masteryPercentage = data.total > 0 ? Math.round((pts / data.total) * 100) : 0;
      return {
        code,
        ...data,
        masteryPercentage,
      };
    });

  // Weakest sub-elements (ranked lowest mastery with at least 1 attempted question)
  const weakestSubelements = [...subelements]
    .filter(se => se.unseen < se.total)
    .sort((a, b) => a.masteryPercentage - b.masteryPercentage)
    .slice(0, 5);

  // 4. Historical Mock Exam Score Trends
  const questionMap = new Map(allQuestions.map(q => [q.id, q]));
  const classAttempts = allAttempts.filter(a => questionMap.has(a.question_id));

  // Extract mock exam sessions
  const mockAttempts = classAttempts
    .filter(a => a.mode === 'mock_exam')
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Group attempts by minute (representing an exam submission timestamp)
  const examGroupMap: Record<string, { correct: number; total: number }> = {};
  for (const att of mockAttempts) {
    const minuteKey = att.created_at.slice(0, 16); // YYYY-MM-DDTHH:mm
    if (!examGroupMap[minuteKey]) {
      examGroupMap[minuteKey] = { correct: 0, total: 0 };
    }
    examGroupMap[minuteKey].total += 1;
    if (att.is_correct) {
      examGroupMap[minuteKey].correct += 1;
    }
  }

  const examHistory: ExamHistoryPoint[] = Object.entries(examGroupMap).map(([, stats], idx) => {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return {
      date: `Exam ${idx + 1}`,
      score: stats.correct,
      total: stats.total,
      percentage: pct,
      isPassed: pct >= 74,
    };
  });

  // 5. Total Activity & Accuracy
  const totalAttempts = classAttempts.length;
  const totalCorrect = classAttempts.filter(a => a.is_correct).length;
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  // Compute daily streak
  const uniqueDates = new Set(classAttempts.map(a => a.created_at.slice(0, 10)));
  const studyStreakDays = uniqueDates.size;

  return {
    readinessScore,
    passProbability,
    totalQuestions,
    bucketDistribution,
    subelements,
    examHistory,
    studyStreakDays,
    totalAttempts,
    totalCorrect,
    overallAccuracy,
    weakestSubelements,
  };
}
