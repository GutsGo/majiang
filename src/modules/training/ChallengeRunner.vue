<script setup lang="ts">
import { computed, ref } from 'vue';
import QuestionCard from '@/components/QuestionCard.vue';
import StageCard from '@/components/StageCard.vue';
import { useTrainingStore } from '@/app/stores/useTrainingStore';
import { evaluateAnswer } from '@/modules/training/evaluator';
import { calcStageStars } from '@/modules/training/progression';
import { saveStageResult } from '@/modules/training/storage';
import { stageMeta } from '@/data/rules';
import type { ChallengeStage, UserAnswerRecord } from '@/types/training';

const store = useTrainingStore();

const selectedStage = ref<ChallengeStage | null>(null);
const questionIndex = ref(0);
const selectedOptionIds = ref<string[]>([]);
const submitted = ref(false);
const currentCorrect = ref(false);
const stageResultMap = ref<Record<string, boolean>>({});
const stageStartAt = ref<number>(0);
const stageFinished = ref(false);
const stageStars = ref(0);
const stageAccuracy = ref(0);
const stageElapsedMs = ref(0);

const unlockedStageSet = computed(() => new Set(store.unlockedState.unlockedStageIds));
const stageCorrect = computed(() => {
  if (!selectedStage.value) return 0;
  return selectedStage.value.questionIds.reduce((total, questionId) => total + (stageResultMap.value[questionId] ? 1 : 0), 0);
});
const stageAnswered = computed(() => {
  if (!selectedStage.value) return 0;
  return selectedStage.value.questionIds.filter((questionId) => Object.prototype.hasOwnProperty.call(stageResultMap.value, questionId)).length;
});

const currentQuestion = computed(() => {
  if (!selectedStage.value) return null;
  const questionId = selectedStage.value.questionIds[questionIndex.value];
  return store.questionsById[questionId] ?? null;
});

const currentQuestionId = computed({
  get: () => currentQuestion.value?.id ?? '',
  set: (questionId: string) => {
    if (!selectedStage.value) return;
    const index = selectedStage.value.questionIds.findIndex((item) => item === questionId);
    if (index === -1) return;
    questionIndex.value = index;
    selectedOptionIds.value = [];
    submitted.value = false;
    currentCorrect.value = false;
  }
});

const buildLatestResultMap = () => {
  const latestMap = new Map<string, boolean>();
  for (const record of store.progress.answerHistory) {
    if (!latestMap.has(record.questionId)) {
      latestMap.set(record.questionId, record.isCorrect);
    }
  }
  return latestMap;
};

const startStage = (stage: ChallengeStage, restart = false) => {
  if (!unlockedStageSet.value.has(stage.id)) return;

  const latestResultMap = buildLatestResultMap();
  const initialResultMap: Record<string, boolean> = {};
  if (!restart) {
    for (const questionId of stage.questionIds) {
      const result = latestResultMap.get(questionId);
      if (result !== undefined) {
        initialResultMap[questionId] = result;
      }
    }
  }

  const firstUnansweredIndex = restart
    ? 0
    : stage.questionIds.findIndex((questionId) => latestResultMap.get(questionId) === undefined);

  selectedStage.value = stage;
  stageResultMap.value = initialResultMap;
  questionIndex.value = firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
  selectedOptionIds.value = [];
  submitted.value = false;
  currentCorrect.value = false;
  stageFinished.value = false;
  stageStars.value = 0;
  stageAccuracy.value = 0;
  stageElapsedMs.value = 0;
  stageStartAt.value = Date.now();
};

const restartStage = () => {
  if (!selectedStage.value) return;
  startStage(selectedStage.value, true);
};

const submitCurrent = () => {
  if (!selectedStage.value || !currentQuestion.value || submitted.value) return;

  const evaluation = evaluateAnswer(currentQuestion.value.id, selectedOptionIds.value);
  currentCorrect.value = evaluation.isCorrect;
  submitted.value = true;
  stageResultMap.value = {
    ...stageResultMap.value,
    [currentQuestion.value.id]: evaluation.isCorrect
  };

  const record: UserAnswerRecord = {
    questionId: currentQuestion.value.id,
    selectedOptionIds: selectedOptionIds.value,
    isCorrect: evaluation.isCorrect,
    elapsedMs: 0,
    mode: 'challenge',
    createdAt: new Date().toISOString()
  };
  store.recordAnswer(record);
};

const nextQuestion = () => {
  if (!selectedStage.value) return;

  const nextIndex = questionIndex.value + 1;
  if (nextIndex >= selectedStage.value.questionIds.length) {
    finishStage();
    return;
  }

  questionIndex.value = nextIndex;
  selectedOptionIds.value = [];
  submitted.value = false;
  currentCorrect.value = false;
};

const skipQuestion = () => {
  nextQuestion();
};

const finishStage = () => {
  if (!selectedStage.value) return;
  stageElapsedMs.value = Date.now() - stageStartAt.value;
  stageAccuracy.value = stageCorrect.value / selectedStage.value.questionIds.length;
  stageStars.value = calcStageStars(stageAccuracy.value);
  stageFinished.value = true;

  const nextProgress = saveStageResult(selectedStage.value.id, stageStars.value, stageElapsedMs.value);
  store.updateProgress(nextProgress);
  store.markStageUnlocked();
};

const resetToMap = () => {
  selectedStage.value = null;
};
</script>

<template>
  <section class="panel challenge-runner">
    <header>
      <h2>闯关模式</h2>
      <p>每关 10 题，正确率与用时共同决定星级。</p>
    </header>

    <section v-if="!selectedStage" class="stage-map">
      <article class="chapter" v-for="(meta, key) in stageMeta" :key="key">
        <h3>{{ meta.emoji }} {{ meta.name }}</h3>
        <div class="stage-grid">
          <button
            type="button"
            class="stage-btn"
            v-for="stage in store.challengeStages.filter((item) => item.chapterId === key)"
            :key="stage.id"
            @click="startStage(stage)"
          >
            <StageCard
              :title="stage.title"
              :description="stage.description"
              :unlocked="unlockedStageSet.has(stage.id)"
              :stars="store.progress.stageStars[stage.id] ?? 0"
            />
          </button>
        </div>
      </article>
    </section>

    <section v-else-if="currentQuestion && !stageFinished" class="stage-playing">
      <div class="status-row">
        <strong>{{ selectedStage.title }}</strong>
        <span>第 {{ questionIndex + 1 }} / {{ selectedStage.questionIds.length }} 题</span>
        <span>已作答 {{ stageAnswered }} 题</span>
        <span>已答对 {{ stageCorrect }} 题</span>
      </div>

      <div class="stage-nav">
        <label>
          选择题目
          <select v-model="currentQuestionId">
            <option v-for="(questionId, index) in selectedStage.questionIds" :key="questionId" :value="questionId">
              第{{ index + 1 }}题 · {{ questionId }}
            </option>
          </select>
        </label>
        <div class="stage-actions">
          <button type="button" class="ghost-btn" @click="skipQuestion">跳过本题</button>
          <button type="button" class="ghost-btn" @click="restartStage">本关重开</button>
        </div>
      </div>

      <QuestionCard
        :question="currentQuestion"
        v-model:selected-option-ids="selectedOptionIds"
        :submitted="submitted"
        :show-explanation="false"
        submit-label="锁定答案"
        @submit="submitCurrent"
      />

      <div v-if="submitted" class="feedback">
        <p :class="currentCorrect ? 'ok' : 'bad'">
          {{ currentCorrect ? '本题正确，继续推进。' : '本题错误，已加入错题本。' }}
        </p>
        <button type="button" @click="nextQuestion">{{ questionIndex + 1 === selectedStage.questionIds.length ? '结算本关' : '下一题' }}</button>
      </div>
    </section>

    <section v-else-if="selectedStage && stageFinished" class="stage-result">
      <h3>{{ selectedStage.title }} 结算</h3>
      <p>正确率：{{ Math.round(stageAccuracy * 100) }}%</p>
      <p>用时：{{ Math.ceil(stageElapsedMs / 1000) }} 秒</p>
      <p>星级：{{ '★'.repeat(stageStars) || '无星' }}</p>
      <button type="button" @click="resetToMap">返回关卡地图</button>
    </section>
  </section>
</template>

<style scoped>
.challenge-runner {
  display: grid;
  gap: 16px;
}

header h2 {
  margin: 0;
  color: #1f3c31;
}

header p {
  margin: 8px 0 0;
  color: #5d816e;
}

.stage-map {
  display: grid;
  gap: 18px;
}

.chapter {
  display: grid;
  gap: 10px;
}

.chapter h3 {
  margin: 0;
  color: #2c4e3f;
}

.stage-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.stage-btn {
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: #355a48;
}

.stage-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
}

.stage-nav label {
  display: grid;
  gap: 6px;
  color: #355a48;
  font-weight: 600;
}

.stage-nav select {
  min-height: 44px;
  min-width: 190px;
  border-radius: 10px;
  border: 1px solid rgba(58, 96, 80, 0.3);
  padding: 0 10px;
}

.stage-actions {
  display: flex;
  gap: 8px;
}

.ghost-btn {
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(47, 106, 79, 0.35);
  background: #fff;
  color: #2f6a4f;
  padding: 10px 14px;
}

.feedback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(52, 85, 69, 0.35);
  padding: 10px;
}

.feedback p {
  margin: 0;
}

.feedback button,
.stage-result button {
  min-height: 44px;
  border-radius: 999px;
  border: none;
  padding: 10px 16px;
  background: #2f6a4f;
  color: #fff;
}

.ok {
  color: #2f6b4f;
}

.bad {
  color: #aa5f53;
}

.stage-result {
  border-radius: 16px;
  border: 1px solid rgba(53, 89, 74, 0.24);
  padding: 16px;
  background: #fffdf6;
}

.stage-result h3 {
  margin: 0 0 10px;
  color: #2b4b3d;
}

.stage-result p {
  margin: 6px 0;
  color: #506f60;
}
</style>
