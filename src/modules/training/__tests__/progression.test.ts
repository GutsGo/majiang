import { describe, expect, it } from 'vitest';
import { challengeStages } from '@/data/questions';
import { calcStageStars, unlockStages } from '@/modules/training/progression';
import { defaultProgress } from '@/modules/training/storage';

describe('progression', () => {
  it('calculates stars by accuracy', () => {
    expect(calcStageStars(0.95)).toBe(3);
    expect(calcStageStars(0.75)).toBe(2);
    expect(calcStageStars(0.55)).toBe(1);
    expect(calcStageStars(0.2)).toBe(0);
  });

  it('unlocks next stage after passing previous stage', () => {
    const progress = defaultProgress();
    progress.stageStars[challengeStages[0].id] = 1;

    const state = unlockStages(progress, challengeStages);

    expect(state.unlockedStageIds).toContain(challengeStages[0].id);
    expect(state.unlockedStageIds).toContain(challengeStages[1].id);
  });
});
