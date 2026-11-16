import { db } from '../db';
import type {
  LicenseClassType,
  SubElement,
  SubElementGroupInfo,
  TopicLessonInfo,
  TopicProgress,
  Question,
} from '../types';

const syllabusCache: Record<string, SubElement[]> = {};

/**
 * Fetches the syllabus hierarchy (SubElements -> SubGroups) for a license class.
 * Cached in memory and localStorage for fast offline performance.
 */
export async function getPoolSyllabus(classType: LicenseClassType): Promise<SubElement[]> {
  if (syllabusCache[classType]) {
    return syllabusCache[classType];
  }

  const storageKey = `ham_syllabus_${classType}`;
  const localCached = localStorage.getItem(storageKey);
  if (localCached) {
    try {
      const parsed: SubElement[] = JSON.parse(localCached);
      syllabusCache[classType] = parsed;
      return parsed;
    } catch {
      // Fallback to fetch
    }
  }

  try {
    const res = await fetch(`/api/questions/pools/${classType}/syllabus`);
    if (!res.ok) {
      throw new Error(`Failed to fetch syllabus: ${res.statusText}`);
    }
    const data: SubElement[] = await res.json();
    syllabusCache[classType] = data;
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  } catch (err) {
    console.error(`Error loading syllabus for ${classType}:`, err);
    // If offline, construct fallback structure from Dexie questions
    return buildFallbackSyllabusFromDexie(classType);
  }
}

async function buildFallbackSyllabusFromDexie(classType: LicenseClassType): Promise<SubElement[]> {
  const questions = await db.questions.where('class_type').equals(classType).toArray();
  const subElementMap = new Map<string, Set<string>>();

  for (const q of questions) {
    if (!subElementMap.has(q.sub_element_code)) {
      subElementMap.set(q.sub_element_code, new Set());
    }
    subElementMap.get(q.sub_element_code)!.add(q.sub_group_code);
  }

  const result: SubElement[] = [];
  const sortedSE = Array.from(subElementMap.keys()).sort();

  for (const seCode of sortedSE) {
    const groups = Array.from(subElementMap.get(seCode)!).sort().map(gCode => ({
      id: gCode,
      code: gCode,
      title: `Topic ${gCode}`,
    }));
    result.push({
      id: seCode,
      code: seCode,
      title: `SubElement ${seCode}`,
      exam_questions_count: 1,
      groups,
    });
  }

  return result;
}

/**
 * Computes full topic curriculum with per-lesson and per-subelement progress
 * based on Dexie question states.
 */
export async function getTopicsWithProgress(
  classType: LicenseClassType
): Promise<SubElementGroupInfo[]> {
  const syllabus = await getPoolSyllabus(classType);
  const questions = await db.questions.where('class_type').equals(classType).toArray();
  const states = await db.question_states.where('class_type').equals(classType).toArray();

  const stateMap = new Map<string, string>();
  for (const s of states) {
    stateMap.set(s.question_id, s.bucket);
  }

  // Group questions by sub_group_code
  const questionsByGroup = new Map<string, Question[]>();
  for (const q of questions) {
    const gCode = q.sub_group_code || q.question_code.slice(0, 3);
    if (!questionsByGroup.has(gCode)) {
      questionsByGroup.set(gCode, []);
    }
    questionsByGroup.get(gCode)!.push(q);
  }

  let globalLessonCounter = 1;
  const result: SubElementGroupInfo[] = [];

  for (const se of syllabus) {
    const lessons: TopicLessonInfo[] = [];
    let seTotal = 0;
    let seMastered = 0;
    let seLearning = 0;
    let seNeedsWork = 0;
    let seUnseen = 0;

    for (const g of se.groups) {
      const gQuestions = questionsByGroup.get(g.code) || [];
      const total = gQuestions.length;

      let mastered = 0;
      let learning = 0;
      let needsWork = 0;
      let unseen = 0;

      for (const q of gQuestions) {
        const bucket = stateMap.get(q.id) || 'unseen';
        if (bucket === 'mastered') mastered++;
        else if (bucket === 'learning') learning++;
        else if (bucket === 'needs_work') needsWork++;
        else unseen++;
      }

      seTotal += total;
      seMastered += mastered;
      seLearning += learning;
      seNeedsWork += needsWork;
      seUnseen += unseen;

      const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

      const groupProgress: TopicProgress = {
        total,
        mastered,
        learning,
        needs_work: needsWork,
        unseen,
        percentage,
      };

      lessons.push({
        lessonNumber: globalLessonCounter++,
        subGroupCode: g.code,
        subElementCode: se.code,
        subElementTitle: se.title,
        title: g.title || `Topic ${g.code}`,
        questionCount: total,
        progress: groupProgress,
      });
    }

    const sePercentage = seTotal > 0 ? Math.round((seMastered / seTotal) * 100) : 0;

    result.push({
      code: se.code,
      title: se.title,
      examQuestionsCount: se.exam_questions_count,
      totalQuestions: seTotal,
      progress: {
        total: seTotal,
        mastered: seMastered,
        learning: seLearning,
        needs_work: seNeedsWork,
        unseen: seUnseen,
        percentage: sePercentage,
      },
      lessons,
    });
  }

  return result;
}

/**
 * Fetches all questions in a specific topic (SubGroup or SubElement),
 * populates their choices and explanations from Dexie, and sorts by question_code.
 */
export async function getTopicQuestions(
  classType: LicenseClassType,
  subGroupCode?: string,
  subElementCode?: string
): Promise<Question[]> {
  let query = db.questions.where('class_type').equals(classType);

  if (subGroupCode) {
    query = query.filter(q => q.sub_group_code === subGroupCode);
  } else if (subElementCode) {
    query = query.filter(q => q.sub_element_code === subElementCode);
  }

  const questions = await query.toArray();

  // Populate choices and explanations if needed
  const questionIds = questions.map(q => q.id);
  const choices = await db.choices.where('question_id').anyOf(questionIds).toArray();
  const explanations = await db.explanations.where('question_id').anyOf(questionIds).toArray();

  const choicesByQuestion = new Map<string, typeof choices>();
  for (const c of choices) {
    const qid = c.question_id;
    if (qid) {
      if (!choicesByQuestion.has(qid)) {
        choicesByQuestion.set(qid, []);
      }
      choicesByQuestion.get(qid)!.push(c);
    }
  }

  const explanationByQuestion = new Map<string, (typeof explanations)[0]>();
  for (const e of explanations) {
    explanationByQuestion.set(e.question_id, e);
  }

  const enriched = questions.map(q => ({
    ...q,
    choices: (choicesByQuestion.get(q.id) || q.choices || []).sort((a, b) =>
      a.original_letter.localeCompare(b.original_letter)
    ),
    explanation: explanationByQuestion.get(q.id) || q.explanation,
  }));

  // Natural sort by question_code (e.g. E1A01, E1A02, ..., E1A10)
  return enriched.sort((a, b) => a.question_code.localeCompare(b.question_code));
}
