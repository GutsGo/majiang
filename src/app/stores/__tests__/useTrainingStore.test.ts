import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTrainingStore } from '@/app/stores/useTrainingStore';
import { trainingQuestions } from '@/data/questions';
import { defaultProgress, saveProgress } from '@/modules/training/storage';

describe('useTrainingStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('deduplicates overview stats by question id and mode', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    saveProgress({
      ...defaultProgress(),
      answerHistory: [
        {
          questionId: trainingQuestions[0].id,
          selectedOptionIds: ['A'],
          isCorrect: false,
          elapsedMs: 500,
          mode: 'explain',
          createdAt: today
        },
        {
          questionId: trainingQuestions[0].id,
          selectedOptionIds: ['B'],
          isCorrect: true,
          elapsedMs: 500,
          mode: 'challenge',
          createdAt: today
        },
        {
          questionId: trainingQuestions[1].id,
          selectedOptionIds: ['A'],
          isCorrect: true,
          elapsedMs: 500,
          mode: 'mistake',
          createdAt: yesterday
        }
      ]
    });

    const store = useTrainingStore();
    const explainStageTotal = Object.values(store.stageProgressMapByMode.explain).reduce((sum, count) => sum + count, 0);
    const challengeStageTotal = Object.values(store.stageProgressMapByMode.challenge).reduce((sum, count) => sum + count, 0);

    expect(store.totalAnsweredByMode.explain).toBe(1);
    expect(store.totalCorrectByMode.explain).toBe(0);
    expect(store.todayAnswerCountByMode.explain).toBe(1);
    expect(store.accuracyByMode.explain).toBe(0);
    expect(explainStageTotal).toBe(1);

    expect(store.totalAnsweredByMode.challenge).toBe(1);
    expect(store.totalCorrectByMode.challenge).toBe(1);
    expect(store.todayAnswerCountByMode.challenge).toBe(1);
    expect(store.accuracyByMode.challenge).toBe(1);
    expect(challengeStageTotal).toBe(1);
  });
});
