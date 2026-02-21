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

  it('deduplicates overview stats by question id', () => {
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
    const totalByStage = Object.values(store.stageProgressMap).reduce((sum, count) => sum + count, 0);

    expect(store.totalAnswered).toBe(2);
    expect(store.totalCorrect).toBe(1);
    expect(store.todayAnswerCount).toBe(1);
    expect(store.accuracy).toBe(0.5);
    expect(totalByStage).toBe(2);
  });
});
