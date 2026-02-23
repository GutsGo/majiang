import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { challengeStages, questionStats, questionsById, ruleTagsWithExamples, trainingQuestions } from '@/data/questions';
import { appendAnswerHistory, appendMistake, loadProgress, loadSettings, saveProgress, saveSettings } from '@/modules/training/storage';
import { unlockStages } from '@/modules/training/progression';
import type { ProgressSnapshot, RuleStageId, UserAnswerRecord, UserSettings } from '@/types/training';

type StatsMode = 'explain' | 'challenge';

export const useTrainingStore = defineStore('training', () => {
  const progress = ref<ProgressSnapshot>(loadProgress());
  const settings = ref<UserSettings>(loadSettings());

  const unlockedState = computed(() => unlockStages(progress.value, challengeStages));

  const answeredRecordMapByMode = computed(() => {
    const explain = new Map<string, UserAnswerRecord>();
    const challenge = new Map<string, UserAnswerRecord>();

    for (const record of progress.value.answerHistory) {
      if (record.mode === 'explain') {
        if (!explain.has(record.questionId)) {
          explain.set(record.questionId, record);
        }
      } else if (record.mode === 'challenge') {
        if (!challenge.has(record.questionId)) {
          challenge.set(record.questionId, record);
        }
      }
    }

    return { explain, challenge };
  });

  const answeredQuestionIdSetByMode = computed(() => ({
    explain: new Set(answeredRecordMapByMode.value.explain.keys()),
    challenge: new Set(answeredRecordMapByMode.value.challenge.keys())
  }));

  const countCorrect = (records: Map<string, UserAnswerRecord>) =>
    Array.from(records.values()).filter((record) => record.isCorrect).length;

  const totalAnsweredByMode = computed(() => ({
    explain: answeredRecordMapByMode.value.explain.size,
    challenge: answeredRecordMapByMode.value.challenge.size
  }));

  const totalCorrectByMode = computed(() => ({
    explain: countCorrect(answeredRecordMapByMode.value.explain),
    challenge: countCorrect(answeredRecordMapByMode.value.challenge)
  }));

  const accuracyByMode = computed(() => ({
    explain: totalAnsweredByMode.value.explain === 0 ? 0 : totalCorrectByMode.value.explain / totalAnsweredByMode.value.explain,
    challenge: totalAnsweredByMode.value.challenge === 0 ? 0 : totalCorrectByMode.value.challenge / totalAnsweredByMode.value.challenge
  }));

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayAnswerCountByMode = computed(() => {
    const todaySets: Record<StatsMode, Set<string>> = {
      explain: new Set<string>(),
      challenge: new Set<string>()
    };

    for (const record of progress.value.answerHistory) {
      if (!record.createdAt.startsWith(todayKey)) continue;
      if (record.mode === 'explain') {
        todaySets.explain.add(record.questionId);
      } else if (record.mode === 'challenge') {
        todaySets.challenge.add(record.questionId);
      }
    }

    return {
      explain: todaySets.explain.size,
      challenge: todaySets.challenge.size
    };
  });

  const buildStageProgressMap = (questionIdSet: Set<string>) => {
    const map: Record<RuleStageId, number> = {
      opening: 0,
      midgame: 0,
      meld: 0,
      defense: 0,
      listening: 0
    };

    for (const question of trainingQuestions) {
      if (questionIdSet.has(question.id)) {
        map[question.stageId] += 1;
      }
    }

    return map;
  };

  const stageProgressMapByMode = computed(() => ({
    explain: buildStageProgressMap(answeredQuestionIdSetByMode.value.explain),
    challenge: buildStageProgressMap(answeredQuestionIdSetByMode.value.challenge)
  }));

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
    answeredRecordMapByMode,
    totalAnsweredByMode,
    totalCorrectByMode,
    accuracyByMode,
    todayAnswerCountByMode,
    stageProgressMapByMode,
    answeredQuestionIdSetByMode,
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
