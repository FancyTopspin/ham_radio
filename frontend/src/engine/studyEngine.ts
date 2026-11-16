import { db } from '../db';
import type {
  LicenseClassType,
  Question,
  StudyBucket,
  StudyFocusPreset,
  AttemptEvent,
} from '../types';

export interface TransitionResult {
  wasPromoted: boolean;
  wasDemoted: boolean;
  oldBucket: StudyBucket;
  newBucket: StudyBucket;
}

/**
 * Records an answer attempt and updates spaced repetition bucket states
 * according to the 2-consecutive-correct promote / 1-wrong demote rule.
 */
export async function recordAttempt(
  question: Question,
  selectedChoiceId: string,
  isCorrect: boolean,
  durationMs: number,
  mode: 'study' | 'mock_exam' | 'mistake_drill'
): Promise<TransitionResult> {
  const now = Date.now();
  const attemptId = crypto.randomUUID();

  // Create append-only event
  const attempt: AttemptEvent = {
    id: attemptId,
    question_id: question.id,
    question_code: question.question_code,
    selected_choice_id: selectedChoiceId,
    is_correct: isCorrect,
    mode: mode,
    duration_ms: durationMs,
    created_at: new Date(now).toISOString(),
    synced: false,
  };

  await db.attempts.add(attempt);

  // Update QuestionState
  let state = await db.question_states.get(question.id);
  if (!state) {
    state = {
      question_id: question.id,
      class_type: question.class_type,
      bucket: 'unseen',
      consecutive_correct: 0,
      last_attempt_at: null,
      in_mistakes_queue: false,
      mistake_consecutive_correct: 0,
    };
  }

  const oldBucket = state.bucket;
  let newBucket = oldBucket;
  let wasPromoted = false;
  let wasDemoted = false;

  if (isCorrect) {
    state.consecutive_correct += 1;

    // Promotion rules (2 consecutive correct -> advance 1 level)
    if (state.consecutive_correct >= 2) {
      if (oldBucket === 'unseen' || oldBucket === 'needs_work') {
        newBucket = 'learning';
        state.consecutive_correct = 0; // reset counter for next tier
        wasPromoted = true;
      } else if (oldBucket === 'learning') {
        newBucket = 'mastered';
        state.consecutive_correct = 2;
        wasPromoted = true;
      }
    } else if (oldBucket === 'unseen') {
      // First correct on unseen moves to learning
      newBucket = 'learning';
      wasPromoted = true;
    }

    // Mistake Drill exit condition (2 consecutive correct in drill)
    if (mode === 'mistake_drill' || state.in_mistakes_queue) {
      state.mistake_consecutive_correct += 1;
      if (state.mistake_consecutive_correct >= 2) {
        state.in_mistakes_queue = false;
        state.mistake_consecutive_correct = 0;
      }
    }
  } else {
    // Demotion rules (1 wrong -> demote 1 level)
    state.consecutive_correct = 0;

    if (oldBucket === 'mastered') {
      newBucket = 'learning';
      wasDemoted = true;
    } else if (oldBucket === 'learning') {
      newBucket = 'needs_work';
      wasDemoted = true;
    } else {
      newBucket = 'needs_work';
      if (oldBucket === 'unseen') {
        wasDemoted = true;
      }
    }

    // Auto-ingestion into Mistake Queue on ANY wrong answer
    state.in_mistakes_queue = true;
    state.mistake_consecutive_correct = 0;
  }

  state.bucket = newBucket;
  state.last_attempt_at = now;

  await db.question_states.put(state);

  return {
    wasPromoted,
    wasDemoted,
    oldBucket,
    newBucket,
  };
}

/**
 * Draws the next question for a continuous study session based on the chosen focus preset.
 * Optionally constrained to a specific topic (SubGroup or SubElement).
 */
export async function drawNextStudyQuestion(
  classType: LicenseClassType,
  preset: StudyFocusPreset = 'balanced',
  excludeIds: string[] = [],
  topicFilter?: { subGroupCode?: string; subElementCode?: string }
): Promise<Question | null> {
  const excludeSet = new Set(excludeIds);

  let allowedIds: Set<string> | null = null;
  if (topicFilter?.subGroupCode || topicFilter?.subElementCode) {
    let qQuery = db.questions.where('class_type').equals(classType);
    if (topicFilter.subGroupCode) {
      qQuery = qQuery.filter(q => q.sub_group_code === topicFilter.subGroupCode);
    } else if (topicFilter.subElementCode) {
      qQuery = qQuery.filter(q => q.sub_element_code === topicFilter.subElementCode);
    }
    const topicQuestions = await qQuery.toArray();
    if (topicQuestions.length === 0) return null;
    allowedIds = new Set(topicQuestions.map(q => q.id));
  }

  const states = await db.question_states
    .where('class_type').equals(classType)
    .toArray();

  if (states.length === 0) return null;

  // Group states by bucket (filtered by topic if specified)
  const buckets: Record<StudyBucket, string[]> = {
    needs_work: [],
    learning: [],
    unseen: [],
    mastered: [],
  };

  for (const s of states) {
    if (allowedIds && !allowedIds.has(s.question_id)) {
      continue;
    }
    if (!excludeSet.has(s.question_id)) {
      buckets[s.bucket].push(s.question_id);
    }
  }

  // Preset probability distribution: [needs_work, learning, unseen, mastered]
  let weights: Record<StudyBucket, number>;
  switch (preset) {
    case 'learn_new':
      weights = { unseen: 70, needs_work: 20, learning: 10, mastered: 0 };
      break;
    case 'review_weaknesses':
      weights = { needs_work: 60, learning: 30, mastered: 10, unseen: 0 };
      break;
    case 'balanced':
    default:
      weights = { needs_work: 50, learning: 30, unseen: 20, mastered: 5 };
      break;
  }

  // Filter out empty buckets
  const activeBuckets = (Object.keys(buckets) as StudyBucket[]).filter(
    b => buckets[b].length > 0 && weights[b] > 0
  );

  let chosenBucket: StudyBucket;

  if (activeBuckets.length === 0) {
    // If all preferred buckets are empty, take ANY bucket that has questions left
    const nonEmpties = (Object.keys(buckets) as StudyBucket[]).filter(b => buckets[b].length > 0);
    if (nonEmpties.length === 0) {
      // If all excluded in this topic/session, reset exclude pool
      if (excludeIds.length > 0) {
        return drawNextStudyQuestion(classType, preset, [], topicFilter);
      }
      return null;
    }
    chosenBucket = nonEmpties[Math.floor(Math.random() * nonEmpties.length)];
  } else {
    // Weighted selection
    const totalWeight = activeBuckets.reduce((sum, b) => sum + weights[b], 0);
    let rand = Math.random() * totalWeight;
    chosenBucket = activeBuckets[0];

    for (const b of activeBuckets) {
      if (rand < weights[b]) {
        chosenBucket = b;
        break;
      }
      rand -= weights[b];
    }
  }

  const candidateIds = buckets[chosenBucket];
  const chosenId = candidateIds[Math.floor(Math.random() * candidateIds.length)];

  const question = await db.questions.get(chosenId);
  return question || null;
}
