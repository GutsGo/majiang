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
    <header class="page-header">
      <div class="title-section">
        <span class="mode-icon">⚔️</span>
        <div class="text">
          <h2>闯关模式</h2>
          <p>每关 10 题，挑战速记与决策极限</p>
        </div>
      </div>
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
      <div class="stage-progress-bar">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${((questionIndex + 1) / selectedStage.questionIds.length) * 100}%` }"></div>
        </div>
        <div class="progress-labels">
          <span class="stage-title">{{ selectedStage.title }}</span>
          <span class="step-info">第 {{ questionIndex + 1 }} / {{ selectedStage.questionIds.length }} 题</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="label">当前进度</span>
          <span class="value">{{ Math.round(((questionIndex + 1) / selectedStage.questionIds.length) * 100) }}%</span>
        </div>
        <div class="stat-card highlight">
          <span class="label">已答对</span>
          <span class="value">{{ stageCorrect }}</span>
        </div>
        <div class="stat-card">
          <span class="label">准确率</span>
          <span class="value">{{ Math.round((stageCorrect / (stageAnswered || 1)) * 100) }}%</span>
        </div>
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

      <Transition name="bounce">
        <div v-if="submitted" class="feedback-overlay" :class="currentCorrect ? 'correct' : 'wrong'">
          <div class="feedback-content">
            <span class="feedback-icon">{{ currentCorrect ? '✨ 正确' : '❌ 错误' }}</span>
            <p>{{ currentCorrect ? '完美决策！继续保持。' : '有些遗憾，这题值得深思。' }}</p>
            <button type="button" class="next-step-btn" @click="nextQuestion">
              {{ questionIndex + 1 === selectedStage.questionIds.length ? '查看本关成就' : '下一题' }}
            </button>
          </div>
        </div>
      </Transition>
    </section>

    <section v-else-if="selectedStage && stageFinished" class="stage-result-card">
      <div class="result-header">
        <div class="stars-display">
          <span v-for="i in 3" :key="i" class="star" :class="{ earned: i <= stageStars }">★</span>
        </div>
        <h3>{{ selectedStage.title }} 通关</h3>
      </div>
      
      <div class="result-stats">
        <div class="res-item">
          <span class="label">正确率</span>
          <span class="value">{{ Math.round(stageAccuracy * 100) }}%</span>
        </div>
        <div class="res-item">
          <span class="label">总用时</span>
          <span class="value">{{ Math.ceil(stageElapsedMs / 1000) }} 秒</span>
        </div>
      </div>

      <div class="result-actions">
        <button type="button" class="primary-btn" @click="resetToMap">返回地图</button>
        <button type="button" class="secondary-btn" @click="restartStage">再次挑战</button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.challenge-runner {
  display: grid;
  gap: 24px;
  padding-bottom: 40px;
}

/* Page Header */
.page-header {
  padding: 16px 8px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-icon {
  font-size: 32px;
  background: #f7f4e7;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.05);
  border: 1px solid rgba(58, 96, 80, 0.1);
}

.title-section h2 {
  margin: 0;
  color: #1a2e25;
  font-size: 24px;
  font-weight: 800;
}

.title-section p {
  margin: 4px 0 0;
  color: #5d7a6e;
  font-size: 14px;
}

/* Stage Map */
.stage-map {
  display: grid;
  gap: 32px;
}

.chapter {
  display: grid;
  gap: 16px;
}

.chapter h3 {
  margin: 0;
  color: #1a2e25;
  font-size: 18px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.stage-btn {
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  transition: transform 0.2s ease;
  cursor: pointer;
}

.stage-btn:hover:not(:disabled) {
  transform: translateY(-4px);
}

/* Playing Mode */
.stage-playing {
  display: grid;
  gap: 20px;
  position: relative;
}

.stage-progress-bar {
  background: #fcfaf0;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  border: 1px solid rgba(58, 96, 80, 0.1);
}

.progress-track {
  height: 8px;
  background: rgba(47, 106, 79, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b983, #2f6a4f);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stage-title {
  font-size: 14px;
  font-weight: 800;
  color: #1a2e25;
}

.step-info {
  font-size: 13px;
  font-weight: 600;
  color: #5d7a6e;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  background: #f7f4e7;
  padding: 12px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(58, 96, 80, 0.15);
}

.stat-card.highlight {
  background: #e4f0e9;
  border-color: #2f6a4f;
}

.stat-card .label {
  font-size: 11px;
  color: #8c9b94;
  font-weight: 700;
  text-transform: uppercase;
}

.stat-card .value {
  font-size: 18px;
  font-weight: 800;
  color: #1a2e25;
}

.stat-card.highlight .value {
  color: #2f6a4f;
}

/* Stage Nav */
.stage-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fcfaf0;
  padding: 12px 20px;
  border-radius: 16px;
  border: 1px solid rgba(58, 96, 80, 0.1);
}

.stage-nav label {
  font-size: 13px;
  font-weight: 700;
  color: #5d7a6e;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-nav select {
  border: none;
  background: #f7f4e7;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #2f6a4f;
  border: 1px solid rgba(58, 96, 80, 0.15);
}

.stage-actions {
  display: flex;
  gap: 8px;
}

.ghost-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(58, 96, 80, 0.2);
  background: #f7f4e7;
  color: #5d7a6e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* Feedback Overlay */
.feedback-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 320px;
  background: #fffdf1;
  padding: 32px;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  z-index: 100;
  text-align: center;
  border: 1px solid rgba(58, 96, 80, 0.1);
}

.feedback-overlay.correct { border-top: 6px solid #42b983; }
.feedback-overlay.wrong { border-top: 6px solid #ea4335; }

.feedback-icon {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
  display: block;
}

.feedback-overlay.correct .feedback-icon { color: #42b983; }
.feedback-overlay.wrong .feedback-icon { color: #ea4335; }

.feedback-overlay p {
  color: #5d7a6e;
  font-size: 15px;
  margin-bottom: 24px;
}

.next-step-btn {
  width: 100%;
  height: 48px;
  background: #2f6a4f;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
}

/* Result Card */
.stage-result-card {
  background: #fffdf1;
  padding: 40px;
  border-radius: 32px;
  text-align: center;
  box-shadow: 0 24px 48px rgba(0,0,0,0.06);
  max-width: 500px;
  margin: 0 auto;
  border: 1px solid rgba(58, 96, 80, 0.15);
}

.result-header h3 {
  font-size: 28px;
  font-weight: 800;
  color: #1a2e25;
  margin: 16px 0;
}

.stars-display {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.star {
  font-size: 48px;
  color: rgba(58, 96, 80, 0.1);
}

.star.earned {
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.result-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 32px 0;
  padding: 24px;
  background: #f7f4e7;
  border-radius: 20px;
  border: 1px solid rgba(58, 96, 80, 0.08);
}

.res-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.res-item .label {
  font-size: 12px;
  font-weight: 700;
  color: #8c9b94;
  text-transform: uppercase;
}

.res-item .value {
  font-size: 24px;
  font-weight: 800;
  color: #1a2e25;
}

.result-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.primary-btn {
  height: 52px;
  background: #2f6a4f;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
}

.secondary-btn {
  height: 52px;
  background: #f7f4e7;
  color: #2f6a4f;
  border: 2px solid #2f6a4f;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
}

/* Transitions */
.bounce-enter-active { animation: bounce-in 0.5s; }
.bounce-leave-active { animation: bounce-in 0.5s reverse; }
@keyframes bounce-in {
  0% { transform: translate(-50%, -50%) scale(0); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); }
}
</style>
