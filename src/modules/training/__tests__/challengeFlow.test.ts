import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createPinia } from 'pinia';
import ChallengeRunner from '@/modules/training/ChallengeRunner.vue';
import { challengeStages, questionsById } from '@/data/questions';
import { useTrainingStore } from '@/app/stores/useTrainingStore';
import { defaultProgress, saveProgress } from '@/modules/training/storage';

describe('ChallengeRunner flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('logs mistakes and saves stage stars after settlement', async () => {
    const user = userEvent.setup();

    render(ChallengeRunner, {
      global: {
        plugins: [createPinia()]
      }
    });

    const stage = challengeStages[0];
    await user.click(screen.getByRole('button', { name: new RegExp(stage.title) }));

    for (let i = 0; i < stage.questionIds.length; i += 1) {
      const question = questionsById[stage.questionIds[i]];
      const selectedId = i === 0
        ? question.options.find((option) => !question.correctOptionIds.includes(option.id))?.id
        : question.correctOptionIds[0];
      const selectedLabel = question.options.find((option) => option.id === selectedId)?.label ?? '';

      await user.click(screen.getByRole('button', { name: new RegExp(selectedLabel) }));
      await user.click(screen.getByRole('button', { name: '锁定答案' }));

      const nextButton = i === stage.questionIds.length - 1 ? '结算本关' : '下一题';
      await user.click(screen.getByRole('button', { name: nextButton }));
    }

    expect(screen.getByText(new RegExp(`${stage.title} 结算`))).toBeTruthy();

    const store = useTrainingStore();
    expect(store.progress.stageStars[stage.id]).toBe(3);
    expect(store.progress.mistakeQuestionIds).toContain(stage.questionIds[0]);
  });

  it('starts from first unanswered question and supports skip/select/restart', async () => {
    const user = userEvent.setup();
    const stage = challengeStages[0];
    const now = new Date().toISOString();

    saveProgress({
      ...defaultProgress(),
      answerHistory: [
        {
          questionId: stage.questionIds[2],
          selectedOptionIds: ['A'],
          isCorrect: true,
          elapsedMs: 500,
          mode: 'challenge',
          createdAt: now
        },
        {
          questionId: stage.questionIds[1],
          selectedOptionIds: ['A'],
          isCorrect: true,
          elapsedMs: 500,
          mode: 'challenge',
          createdAt: now
        },
        {
          questionId: stage.questionIds[0],
          selectedOptionIds: ['A'],
          isCorrect: false,
          elapsedMs: 500,
          mode: 'challenge',
          createdAt: now
        }
      ]
    });

    render(ChallengeRunner, {
      global: {
        plugins: [createPinia()]
      }
    });

    await user.click(screen.getByRole('button', { name: new RegExp(stage.title) }));
    expect(screen.getByText(/第 4 \/ 10 题/)).toBeTruthy();

    await user.selectOptions(screen.getByLabelText('选择题目'), stage.questionIds[8]);
    expect(screen.getByText(/第 9 \/ 10 题/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '跳过本题' }));
    expect(screen.getByText(/第 10 \/ 10 题/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '本关重开' }));
    expect(screen.getByText(/第 1 \/ 10 题/)).toBeTruthy();
  });
});
