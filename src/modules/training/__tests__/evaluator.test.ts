import { describe, expect, it } from 'vitest';
import { evaluateAnswer } from '@/modules/training/evaluator';

describe('evaluateAnswer', () => {
  it('returns correct for exact single choice', () => {
    const result = evaluateAnswer('opening-001', ['C']);
    expect(result.isCorrect).toBe(true);
    expect(result.missingOptionIds).toHaveLength(0);
    expect(result.extraOptionIds).toHaveLength(0);
  });

  it('returns incorrect when selected options mismatch', () => {
    const result = evaluateAnswer('opening-001', ['A']);
    expect(result.isCorrect).toBe(false);
    expect(result.missingOptionIds).toContain('C');
    expect(result.extraOptionIds).toContain('A');
  });
});
