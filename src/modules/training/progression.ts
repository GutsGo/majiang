import type { ChallengeStage, ProgressSnapshot, StageUnlockState } from '@/types/training';

export const calcStageStars = (accuracy: number): number => {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy >= 0.5) return 1;
  return 0;
};

export const unlockStages = (
  progress: ProgressSnapshot,
  stages: ChallengeStage[]
): StageUnlockState => {
  if (stages.length === 0) {
    return { unlockedStageIds: [], completionRate: 0 };
  }

  const unlocked = new Set<string>(progress.unlockedStageIds);
  unlocked.add(stages[0].id);

  for (let index = 1; index < stages.length; index += 1) {
    const previousStage = stages[index - 1];
    const previousStars = progress.stageStars[previousStage.id] ?? 0;
    if (previousStars >= 1 || progress.completedStageIds.includes(previousStage.id)) {
      unlocked.add(stages[index].id);
    }
  }

  const unlockedStageIds = stages
    .map((stage) => stage.id)
    .filter((stageId) => unlocked.has(stageId));

  const nextLocked = stages.find((stage) => !unlocked.has(stage.id));

  return {
    unlockedStageIds,
    nextLockedStageId: nextLocked?.id,
    completionRate: unlockedStageIds.length / stages.length
  };
};
