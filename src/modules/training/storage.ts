import type { ProgressSnapshot, UserAnswerRecord, UserSettings } from '@/types/training';

const PROGRESS_KEY = 'panda-majiang-progress-v1';
const SETTINGS_KEY = 'panda-majiang-settings-v1';

export const defaultProgress = (): ProgressSnapshot => ({
  completedStageIds: [],
  stageStars: {},
  stageBestTimeMs: {},
  unlockedStageIds: ['stage-01'],
  answerHistory: [],
  mistakeQuestionIds: []
});

export const defaultSettings = (): UserSettings => ({
  fontScale: 'md',
  soundEnabled: true,
  handedness: 'right'
});

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const loadProgress = (): ProgressSnapshot => {
  const parsed = safeParse<ProgressSnapshot>(localStorage.getItem(PROGRESS_KEY));
  if (!parsed) return defaultProgress();
  return {
    ...defaultProgress(),
    ...parsed,
    stageStars: { ...parsed.stageStars },
    stageBestTimeMs: { ...parsed.stageBestTimeMs }
  };
};

export const saveProgress = (progress: ProgressSnapshot) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const appendAnswerHistory = (record: UserAnswerRecord) => {
  const progress = loadProgress();
  const answerHistory = [record, ...progress.answerHistory].slice(0, 500);
  const next = { ...progress, answerHistory };
  saveProgress(next);
  return next;
};

export const appendMistake = (questionId: string) => {
  const progress = loadProgress();
  if (progress.mistakeQuestionIds.includes(questionId)) return progress;
  const next = {
    ...progress,
    mistakeQuestionIds: [questionId, ...progress.mistakeQuestionIds].slice(0, 200)
  };
  saveProgress(next);
  return next;
};

export const clearMistakes = () => {
  const progress = loadProgress();
  const next = {
    ...progress,
    mistakeQuestionIds: []
  };
  saveProgress(next);
  return next;
};

export const loadMistakes = (): string[] => loadProgress().mistakeQuestionIds;

export const saveStageResult = (stageId: string, stars: number, elapsedMs: number) => {
  const progress = loadProgress();
  const bestStars = Math.max(progress.stageStars[stageId] ?? 0, stars);
  const previousTime = progress.stageBestTimeMs[stageId];
  const bestTime = previousTime ? Math.min(previousTime, elapsedMs) : elapsedMs;

  const completed = new Set(progress.completedStageIds);
  if (stars >= 1) completed.add(stageId);

  const next = {
    ...progress,
    completedStageIds: Array.from(completed),
    stageStars: {
      ...progress.stageStars,
      [stageId]: bestStars
    },
    stageBestTimeMs: {
      ...progress.stageBestTimeMs,
      [stageId]: bestTime
    }
  };

  saveProgress(next);
  return next;
};

export const loadSettings = (): UserSettings => {
  const parsed = safeParse<UserSettings>(localStorage.getItem(SETTINGS_KEY));
  return {
    ...defaultSettings(),
    ...parsed
  };
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
