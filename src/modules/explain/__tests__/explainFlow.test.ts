import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import ExplainTrainer from '@/modules/explain/ExplainTrainer.vue';
import { trainingQuestions } from '@/data/questions';
import { defaultProgress, saveProgress } from '@/modules/training/storage';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/explain', component: ExplainTrainer }]
});

describe('ExplainTrainer flow', () => {
  beforeEach(async () => {
    router.push('/explain');
    await router.isReady();
  });

  it('reveals explanation after submit', async () => {
    const user = userEvent.setup();
    render(ExplainTrainer, {
      global: {
        plugins: [createPinia(), router]
      }
    });

    const firstQuestion = trainingQuestions[0];
    const correct = firstQuestion.options.find((option) => option.id === firstQuestion.correctOptionIds[0]);

    await user.click(screen.getByRole('button', { name: new RegExp(correct?.label ?? '', 'i') }));
    await user.click(screen.getByRole('button', { name: '提交并查看讲解' }));

    expect(screen.getByText('解题讲解')).toBeTruthy();
    expect(screen.getByText('回答正确，继续巩固。')).toBeTruthy();
  });

  it('starts from first unanswered question and supports skip/select/restart', async () => {
    const user = userEvent.setup();
    const now = new Date().toISOString();
    saveProgress({
      ...defaultProgress(),
      answerHistory: [
        {
          questionId: trainingQuestions[1].id,
          selectedOptionIds: ['A'],
          isCorrect: true,
          elapsedMs: 1000,
          mode: 'explain',
          createdAt: now
        },
        {
          questionId: trainingQuestions[0].id,
          selectedOptionIds: ['A'],
          isCorrect: true,
          elapsedMs: 1000,
          mode: 'explain',
          createdAt: now
        }
      ]
    });

    render(ExplainTrainer, {
      global: {
        plugins: [createPinia(), router]
      }
    });

    expect(await screen.findByText(/第 3 \/ 120 题/)).toBeTruthy();

    await user.selectOptions(screen.getByLabelText('选择题目'), trainingQuestions[4].id);
    expect(screen.getByText(/第 5 \/ 120 题/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '跳过本题' }));
    expect(screen.getByText(/第 6 \/ 120 题/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '重新开始' }));
    expect(screen.getByText(/第 1 \/ 120 题/)).toBeTruthy();
  });
});
