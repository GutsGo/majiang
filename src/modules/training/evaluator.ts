import { questionsById } from '@/data/questions';
import type { EvaluationResult } from '@/types/training';

export const evaluateAnswer = (questionId: string, selectedOptionIds: string[]): EvaluationResult => {
  const question = questionsById[questionId];
  if (!question) {
    throw new Error(`Question not found: ${questionId}`);
  }

  const expected = [...question.correctOptionIds].sort();
  const selected = [...new Set(selectedOptionIds)].sort();
  const missing = expected.filter((id) => !selected.includes(id));
  const extra = selected.filter((id) => !expected.includes(id));

  return {
    questionId,
    isCorrect: missing.length === 0 && extra.length === 0,
    expectedOptionIds: expected,
    selectedOptionIds: selected,
    missingOptionIds: missing,
    extraOptionIds: extra
  };
};
