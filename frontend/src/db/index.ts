import Dexie, { type Table } from 'dexie';
import type { Question, Choice, Explanation, QuestionState, AttemptEvent } from '../types';

export class HamRadioDatabase extends Dexie {
  questions!: Table<Question, string>;
  choices!: Table<Choice, string>;
  explanations!: Table<Explanation & { question_id: string }, string>;
  question_states!: Table<QuestionState, string>;
  attempts!: Table<AttemptEvent, string>;

  constructor() {
    super('HamRadioStudyDB');
    this.version(1).stores({
      questions: 'id, class_type, pool_version, question_code, sub_element_code, sub_group_code, has_diagram',
      choices: 'id, question_id, is_correct, is_pinned_bottom',
      explanations: 'question_id',
      question_states: 'question_id, class_type, bucket, last_attempt_at, in_mistakes_queue',
      attempts: 'id, question_id, is_correct, mode, created_at, synced',
    });
  }
}

export const db = new HamRadioDatabase();
