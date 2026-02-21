import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { challengeStages, questionStats, questionsById, ruleTagsWithExamples, trainingQuestions } from '@/data/questions';
import { appendAnswerHistory, appendMistake, loadProgress, loadSettings, saveProgress, saveSettings } from '@/modules/training/storage';
import { unlockStages } from '@/modules/training/progression';
import type { ProgressSnapshot, RuleStageId, UserAnswerRecord, UserSettings } from '@/types/training';

export const useTrainingStore = defineStore('training', () => {
  const progress = ref<ProgressSnapshot>(loadProgress());
  const settings = ref<UserSettings>(loadSettings());

  const unlockedState = computed(() => unlockStages(progress.value, challengeStages));

  const answeredRecordMap = computed(() => {
    const map = new Map<string, UserAnswerRecord>();
    for (const record of progress.value.answerHistory) {
      if (!map.has(record.questionId)) {
        map.set(record.questionId, record);
      }
    }
    return map;
  });

  const answeredQuestionIdSet = computed(() => new Set(answeredRecordMap.value.keys()));
  const totalAnswered = computed(() => answeredRecordMap.value.size);
  const totalCorrect = computed(
    () => Array.from(answeredRecordMap.value.values()).filter((record) => record.isCorrect).length
  );
  const accuracy = computed(() => {
    if (totalAnswered.value === 0) return 0;
    return totalCorrect.value / totalAnswered.value;
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayAnswerCount = computed(
    () => {
      const todaySet = new Set<string>();
      for (const record of progress.value.answerHistory) {
        if (record.createdAt.startsWith(todayKey)) {
          todaySet.add(record.questionId);
        }
      }
      return todaySet.size;
    }
  );

  const stageProgressMap = computed(() => {
    const map: Record<RuleStageId, number> = {
      opening: 0,
      midgame: 0,
      meld: 0,
      defense: 0,
      listening: 0
    };

    for (const question of trainingQuestions) {
      if (answeredQuestionIdSet.value.has(question.id)) {
        map[question.stageId] += 1;
      }
    }

    return map;
  });

  const refreshProgress = () => {
    progress.value = loadProgress();
  };

  const recordAnswer = (record: UserAnswerRecord) => {
    progress.value = appendAnswerHistory(record);
    if (!record.isCorrect) {
      progress.value = appendMistake(record.questionId);
    }
  };

  const updateProgress = (next: ProgressSnapshot) => {
    progress.value = next;
    saveProgress(next);
  };

  const markStageUnlocked = () => {
    const unlockedIds = unlockStages(progress.value, challengeStages).unlockedStageIds;
    const next = {
      ...progress.value,
      unlockedStageIds: unlockedIds
    };
    updateProgress(next);
  };

  const updateSettings = (next: UserSettings) => {
    settings.value = next;
    saveSettings(next);
  };

  return {
    progress,
    settings,
    unlockedState,
    totalAnswered,
    totalCorrect,
    accuracy,
    todayAnswerCount,
    stageProgressMap,
    answeredQuestionIdSet,
    questionsById,
    trainingQuestions,
    challengeStages,
    ruleTagsWithExamples,
    questionStats,
    refreshProgress,
    recordAnswer,
    updateProgress,
    markStageUnlocked,
    updateSettings
  };
});
