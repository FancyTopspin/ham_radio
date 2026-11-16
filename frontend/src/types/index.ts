export type LicenseClassType = 'TECH' | 'GEN' | 'EXTRA';

export type StudyBucket = 'unseen' | 'needs_work' | 'learning' | 'mastered';

export type StudyFocusPreset = 'balanced' | 'learn_new' | 'review_weaknesses';

export type SessionBatchSize = 10 | 25 | 50 | 'continuous';

export interface Choice {
  id: string;
  original_letter: 'A' | 'B' | 'C' | 'D';
  choice_text: string;
  is_pinned_bottom: boolean;
  is_correct?: boolean;
}

export interface Explanation {
  explanation_markdown: string;
  fcc_citation_url: string;
  is_admin_verified: boolean;
}

export interface Question {
  id: string;
  pool_version: string;
  class_type: LicenseClassType;
  question_code: string;
  sub_element_code: string;
  sub_group_code: string;
  question_text: string;
  fcc_citation: string;
  has_diagram: boolean;
  diagram_figure_name: string;
  diagram_image_url?: string | null;
  shuffle_disabled: boolean;
  correct_choice_id?: string;
  choices: Choice[];
  explanation?: Explanation | null;
}

export interface QuestionState {
  question_id: string;
  class_type: LicenseClassType;
  bucket: StudyBucket;
  consecutive_correct: number;
  last_attempt_at: number | null; // epoch ms
  in_mistakes_queue: boolean;
  mistake_consecutive_correct: number;
}

export interface AttemptEvent {
  id: string;
  question_id: string;
  question_code?: string;
  selected_choice_id: string;
  is_correct: boolean;
  mode: 'study' | 'mock_exam' | 'mistake_drill';
  duration_ms: number;
  created_at: string; // ISO string
  synced: boolean;
}

export interface LicensePoolMetadata {
  id: string;
  class_type: LicenseClassType;
  class_name: string;
  pool_version: string;
  is_active: boolean;
  total_questions: number;
  exam_quota: number;
}

export interface SubGroup {
  id: string;
  code: string;
  title: string;
}

export interface SubElement {
  id: string;
  code: string;
  title: string;
  exam_questions_count: number;
  groups: SubGroup[];
}

export interface SessionMilestoneStats {
  totalAnswered: number;
  correctCount: number;
  accuracy: number;
  promotions: number;
  demotions: number;
  timeSpentMs: number;
}

export type FeedbackCategory =
  | 'general'
  | 'question_issue'
  | 'feature_request'
  | 'exam_experience'
  | 'passed_exam';

export interface FeedbackPreset {
  category?: FeedbackCategory;
  questionCode?: string;
}
