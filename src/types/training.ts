export type RuleStageId =
  | 'opening'
  | 'midgame'
  | 'meld'
  | 'defense'
  | 'listening';

export type QuestionType =
  | 'discard_best'
  | 'wait_tiles'
  | 'safe_discard'
  | 'peng_or_pass'
  | 'dingque_or_huansan'
  | 'judge_pattern'
  | 'true_false'
  | 'analyze_situation'
  | 'choose_strategy';

export interface RuleTag {
  id: string;
  stageId: RuleStageId;
  title: string;
  mnemonic: string;
  description: string;
  exampleQuestionIds: string[];
}

export interface ExplanationStep {
  id: string;
  title: string;
  detail: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  note?: string;
}

export interface TrainingQuestion {
  id: string;
  stageId: RuleStageId;
  type: QuestionType;
  difficulty: 1 | 2 | 3;
  prompt: string;
  hand: string[];
  discards?: string[];
  options: QuestionOption[];
  correctOptionIds: string[];
  multiSelect: boolean;
  ruleRefs: string[];
  explanationSteps: ExplanationStep[];
  pitfalls: string[];
}

export interface ChallengeStage {
  id: string;
  chapterId: RuleStageId;
  title: string;
  description: string;
  questionIds: string[];
  recommendedRuleTags: string[];
  difficulty: 1 | 2 | 3;
}

export interface UserAnswerRecord {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  elapsedMs: number;
  mode: 'explain' | 'challenge' | 'mistake';
  createdAt: string;
}

export interface ProgressSnapshot {
  completedStageIds: string[];
  stageStars: Record<string, number>;
  stageBestTimeMs: Record<string, number>;
  unlockedStageIds: string[];
  answerHistory: UserAnswerRecord[];
  mistakeQuestionIds: string[];
}

export interface UserSettings {
  fontScale: 'sm' | 'md' | 'lg';
  soundEnabled: boolean;
  handedness: 'right' | 'left';
}

export interface EvaluationResult {
  questionId: string;
  isCorrect: boolean;
  expectedOptionIds: string[];
  selectedOptionIds: string[];
  missingOptionIds: string[];
  extraOptionIds: string[];
}

export interface StageUnlockState {
  unlockedStageIds: string[];
  nextLockedStageId?: string;
  completionRate: number;
}
