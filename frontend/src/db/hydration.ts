import { db } from './index';
import type { LicenseClassType, Question, QuestionState } from '../types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const POOL_VERSIONS: Record<LicenseClassType, string> = {
  TECH: '2026-2030_v1',
  GEN: '2023-2027_v1',
  EXTRA: '2024-2028_v1',
};

export async function hydratePoolQuestions(classType: LicenseClassType, force = false): Promise<number> {
  const currentPoolVersion = POOL_VERSIONS[classType];
  const storedVersion = localStorage.getItem(`ham_pool_version_${classType}`);
  const versionMismatch = storedVersion !== currentPoolVersion;
  const isForce = force || versionMismatch;

  const existingCount = await db.questions.where('class_type').equals(classType).count();
  const hasRichExplanations = localStorage.getItem(`ham_rich_explanations_${classType}`) === 'v2';
  const hasDiagrams = localStorage.getItem(`ham_diagrams_${classType}`) === 'v1';
  
  if (existingCount > 0 && !isForce && hasRichExplanations && hasDiagrams) {
    // Run time-decay check on already loaded questions
    await applyTimeDecay(classType);
    return existingCount;
  }

  try {
    const response = await fetch(`/api/questions/pools/${classType}/questions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${classType} pool: ${response.statusText}`);
    }

    const questions: Question[] = await response.json();
    
    // Add class_type to each question
    const preparedQuestions = questions.map(q => ({
      ...q,
      class_type: classType,
    }));

    await db.transaction('rw', [db.questions, db.choices, db.explanations, db.question_states], async () => {
      // Clear old questions for this class if forcing refresh or version mismatch
      if (isForce) {
        const oldIds = await db.questions.where('class_type').equals(classType).primaryKeys();
        await db.questions.bulkDelete(oldIds);
        await db.choices.where('question_id').anyOf(oldIds).delete();
        await db.explanations.where('question_id').anyOf(oldIds).delete();
        await db.question_states.where('class_type').equals(classType).delete();
      }

      await db.questions.bulkPut(preparedQuestions);

      // Extract choices and explanations for normalized indexing
      const allChoices = preparedQuestions.flatMap(q => 
        (q.choices || []).map(c => ({ ...c, question_id: q.id }))
      );
      if (allChoices.length > 0) {
        await db.choices.bulkPut(allChoices);
      }

      const allExplanations = preparedQuestions
        .filter(q => q.explanation)
        .map(q => ({ ...q.explanation!, question_id: q.id }));
      if (allExplanations.length > 0) {
        await db.explanations.bulkPut(allExplanations);
      }

      // Initialize QuestionState for each question
      const existingStates = new Set(
        await db.question_states.where('class_type').equals(classType).primaryKeys()
      );

      const newStates: QuestionState[] = preparedQuestions
        .filter(q => !existingStates.has(q.id))
        .map(q => ({
          question_id: q.id,
          class_type: classType,
          bucket: 'unseen',
          consecutive_correct: 0,
          last_attempt_at: null,
          in_mistakes_queue: false,
          mistake_consecutive_correct: 0,
        }));

      if (newStates.length > 0) {
        await db.question_states.bulkPut(newStates);
      }
      localStorage.setItem(`ham_rich_explanations_${classType}`, 'v2');
      localStorage.setItem(`ham_diagrams_${classType}`, 'v1');
      localStorage.setItem(`ham_pool_version_${classType}`, currentPoolVersion);
    });

    await applyTimeDecay(classType);
    return preparedQuestions.length;
  } catch (error) {
    console.error('Error hydrating questions from backend:', error);
    return existingCount;
  }
}

/**
 * Checks all Mastered questions for this class.
 * If 7 days have passed without practice, demotes Mastered -> Learning.
 */
export async function applyTimeDecay(classType: LicenseClassType): Promise<number> {
  const now = Date.now();
  const decayCutoff = now - SEVEN_DAYS_MS;

  const masteredStates = await db.question_states
    .where('class_type').equals(classType)
    .filter(s => s.bucket === 'mastered' && s.last_attempt_at !== null && s.last_attempt_at < decayCutoff)
    .toArray();

  if (masteredStates.length > 0) {
    const updates = masteredStates.map(s => ({
      ...s,
      bucket: 'learning' as const,
      consecutive_correct: 1, // Ready for next promotion
    }));
    await db.question_states.bulkPut(updates);
    console.log(`[Time-Decay] Reintroduced ${updates.length} mastered questions into Learning bucket.`);
  }

  return masteredStates.length;
}

/**
 * Safe per-class progress reset (resets all buckets to unseen, clears streaks and mistake queue).
 */
export async function resetClassProgress(classType: LicenseClassType): Promise<void> {
  const questions = await db.questions.where('class_type').equals(classType).toArray();
  const resetStates: QuestionState[] = questions.map(q => ({
    question_id: q.id,
    class_type: classType,
    bucket: 'unseen',
    consecutive_correct: 0,
    last_attempt_at: null,
    in_mistakes_queue: false,
    mistake_consecutive_correct: 0,
  }));
  await db.question_states.bulkPut(resetStates);
}
