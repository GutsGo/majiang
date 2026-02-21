import { describe, expect, it } from 'vitest';
import { ruleTags } from '@/data/rules';
import { questionStats, ruleTagsWithExamples, trainingQuestions } from '@/data/questions';

describe('rules and questions mapping', () => {
  it('contains exactly 120 questions with required stage distribution', () => {
    expect(trainingQuestions).toHaveLength(120);
    expect(questionStats.byStage.opening).toBe(24);
    expect(questionStats.byStage.midgame).toBe(30);
    expect(questionStats.byStage.meld).toBe(18);
    expect(questionStats.byStage.defense).toBe(24);
    expect(questionStats.byStage.listening).toBe(24);
  });

  it('ensures all question rule refs exist', () => {
    const ruleIds = new Set(ruleTags.map((tag) => tag.id));
    for (const question of trainingQuestions) {
      expect(question.ruleRefs.length).toBeGreaterThan(0);
      for (const ruleId of question.ruleRefs) {
        expect(ruleIds.has(ruleId)).toBe(true);
      }
    }
  });

  it('ensures every rule has at least one example question', () => {
    for (const rule of ruleTagsWithExamples) {
      expect(rule.exampleQuestionIds.length).toBeGreaterThan(0);
    }
  });
});
