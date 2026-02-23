<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMediaQuery } from '@vueuse/core';
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
const showStageNav = ref(false);
const isLargeScreen = useMediaQuery('(min-width: 768px)');

const unlockedStageSet = computed(
  () => new Set(store.unlockedState.unlockedStageIds),
);
const stageCorrect = computed(() => {
  if (!selectedStage.value) return 0;
  return selectedStage.value.questionIds.reduce(
    (total, questionId) => total + (stageResultMap.value[questionId] ? 1 : 0),
    0,
  );
});
const stageAnswered = computed(() => {
  if (!selectedStage.value) return 0;
  return selectedStage.value.questionIds.filter((questionId) =>
    Object.prototype.hasOwnProperty.call(stageResultMap.value, questionId),
  ).length;
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
    const index = selectedStage.value.questionIds.findIndex(
      (item) => item === questionId,
    );
    if (index === -1) return;
    questionIndex.value = index;
    selectedOptionIds.value = [];
    submitted.value = false;
    currentCorrect.value = false;
  },
});

const buildLatestResultMap = () => {
  const latestMap = new Map<string, boolean>();
  for (const [questionId, record] of store.answeredRecordMapByMode.challenge) {
    latestMap.set(questionId, record.isCorrect);
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
    : stage.questionIds.findIndex(
        (questionId) => latestResultMap.get(questionId) === undefined,
      );

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

  const evaluation = evaluateAnswer(
    currentQuestion.value.id,
    selectedOptionIds.value,
  );
  currentCorrect.value = evaluation.isCorrect;
  submitted.value = true;
  stageResultMap.value = {
    ...stageResultMap.value,
    [currentQuestion.value.id]: evaluation.isCorrect,
  };

  const record: UserAnswerRecord = {
    questionId: currentQuestion.value.id,
    selectedOptionIds: selectedOptionIds.value,
    isCorrect: evaluation.isCorrect,
    elapsedMs: 0,
    mode: 'challenge',
    createdAt: new Date().toISOString(),
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
  stageAccuracy.value =
    stageCorrect.value / selectedStage.value.questionIds.length;
  stageStars.value = calcStageStars(stageAccuracy.value);
  stageFinished.value = true;

  const nextProgress = saveStageResult(
    selectedStage.value.id,
    stageStars.value,
    stageElapsedMs.value,
  );
  store.updateProgress(nextProgress);
  store.markStageUnlocked();
};

const resetToMap = () => {
  selectedStage.value = null;
};

const scrollToExplanation = () => {
  const el = document.querySelector('.explain-card');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
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
            v-for="stage in store.challengeStages.filter(
              (item) => item.chapterId === key,
            )"
            :key="stage.id"
            @click="startStage(stage)"
          >
            <StageCard
              :title="stage.title"
              :description="stage.description"
              :unlocked="unlockedStageSet.has(stage.id)"
              :difficulty="stage.difficulty"
              :completion-stars="store.progress.stageStars[stage.id] ?? 0"
            />
          </button>
        </div>
      </article>
    </section>

    <section
      v-else-if="currentQuestion && !stageFinished"
      class="stage-playing"
    >
      <div class="stage-progress-bar">
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{
              width: `${((questionIndex + 1) / selectedStage.questionIds.length) * 100}%`,
            }"
          ></div>
        </div>
        <div class="progress-labels">
          <span class="stage-title">{{ selectedStage.title }}</span>
          <span class="step-info"
            >第 {{ questionIndex + 1 }} /
            {{ selectedStage.questionIds.length }} 题</span
          >
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="label">当前进度</span>
          <span class="value"
            >{{
              Math.round(
                ((questionIndex + 1) / selectedStage.questionIds.length) * 100,
              )
            }}%</span
          >
        </div>
        <div class="stat-card highlight">
          <span class="label">已答对</span>
          <span class="value">{{ stageCorrect }}</span>
        </div>
        <div class="stat-card">
          <span class="label">准确率</span>
          <span class="value"
            >{{
              Math.round((stageCorrect / (stageAnswered || 1)) * 100)
            }}%</span
          >
        </div>
      </div>

      <div class="stage-nav" :class="{ collapsed: !showStageNav }">
        <div class="mobile-header" @click="showStageNav = !showStageNav">
          <div class="current-progress">
            <span class="idx"
              >第 {{ questionIndex + 1 }} /
              {{ selectedStage.questionIds.length }} 题</span
            >
            <span class="type-badge">{{ selectedStage.title }}</span>
          </div>
          <button class="toggle-btn">
            {{ showStageNav ? '收起设置' : '调整设置' }}
          </button>
        </div>

        <div class="stage-nav-content" v-show="showStageNav || isLargeScreen">
          <label>
            选择题目
            <select v-model="currentQuestionId">
              <option
                v-for="(questionId, index) in selectedStage.questionIds"
                :key="questionId"
                :value="questionId"
              >
                第{{ index + 1 }}题 · {{ questionId }}
              </option>
            </select>
          </label>
          <div class="stage-actions">
            <button type="button" class="ghost-btn" @click="skipQuestion">
              跳过本题
            </button>
            <button type="button" class="ghost-btn" @click="restartStage">
              本关重开
            </button>
          </div>
        </div>
      </div>

      <QuestionCard
        :question="currentQuestion"
        v-model:selected-option-ids="selectedOptionIds"
        :submitted="submitted"
        :show-explanation="true"
        submit-label="锁定答案"
        @submit="submitCurrent"
      />

      <!-- 同样为闯关模式添加吸底反馈，避免用户在大屏/长内容下找不到“下一题” -->
      <Transition name="slide-up">
        <div
          class="sticky-footer"
          :class="currentCorrect ? 'is-ok' : 'is-bad'"
          v-if="submitted"
        >
          <div class="footer-content">
            <div class="result-status" :class="currentCorrect ? 'ok' : 'bad'">
              <span class="status-icon">{{
                currentCorrect ? '✨' : '❌'
              }}</span>
              <div class="status-text">
                <strong>{{
                  currentCorrect ? '回答正确！' : '回答有误'
                }}</strong>
                <p>
                  {{
                    currentCorrect
                      ? '完美决策，继续保持。'
                      : '有些遗憾，看看解析再战。'
                  }}
                </p>
              </div>
            </div>
            <div class="footer-actions">
              <button
                type="button"
                class="secondary-btn-small"
                @click="scrollToExplanation"
              >
                查看解析
              </button>
              <button type="button" class="next-btn" @click="nextQuestion">
                {{
                  questionIndex + 1 === selectedStage.questionIds.length
                    ? '查看本关成就'
                    : '下一题'
                }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <section
      v-else-if="selectedStage && stageFinished"
      class="stage-result-card"
    >
      <div class="result-header">
        <div class="stars-display">
          <span
            v-for="i in 3"
            :key="i"
            class="star"
            :class="{ earned: i <= stageStars }"
            >★</span
          >
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
        <button type="button" class="primary-btn" @click="resetToMap">
          返回地图
        </button>
        <button type="button" class="secondary-btn" @click="restartStage">
          再次挑战
        </button>
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
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
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
  display: grid;
  gap: 12px;
  background: #fcfaf0;
  padding: 12px 20px;
  border-radius: 16px;
  border: 1px solid rgba(58, 96, 80, 0.1);
}

.stage-nav .mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stage-nav .current-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stage-nav .idx {
  font-weight: 800;
  color: #1a2e25;
  font-size: 14px;
}

.stage-nav .type-badge {
  font-size: 11px;
  padding: 2px 10px;
  background: #f1f8f5;
  color: #2f6a4f;
  border-radius: 6px;
  font-weight: 700;
  text-transform: uppercase;
}

.stage-nav .toggle-btn {
  font-size: 12px;
  color: #5d7a6e;
  background: #f7f4e7;
  border: 1px solid rgba(58, 96, 80, 0.15);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
}

.stage-nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stage-nav label {
  font-size: 14px;
  font-weight: 600;
  color: #355a48;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.stage-nav select {
  background: #f7f4e7;
  border: 1px solid rgba(58, 96, 80, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #2f6a4f;
  min-width: 0;
  max-width: 100%;
}

.stage-actions {
  display: flex;
  gap: 12px;
}

.ghost-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid rgba(58, 96, 80, 0.18);
  background: #f7f4e7;
  color: #2c4e3f;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ghost-btn:hover {
  border-color: #2f6a4f;
  background: #f1f8f5;
  color: #2f6a4f;
}

/* Sticky Footer Feedback */
.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fffdf1;
  padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
  box-shadow: 0 -8px 24px rgba(34, 66, 52, 0.12);
  border-top: 1px solid rgba(56, 93, 77, 0.2);
  z-index: 1000;
}

.sticky-footer.is-ok {
  background: linear-gradient(90deg, rgba(66, 185, 131, 0.18), #fffdf1 45%);
  border-top-color: rgba(46, 125, 50, 0.4);
}

.sticky-footer.is-bad {
  background: linear-gradient(90deg, rgba(211, 47, 47, 0.16), #fffdf1 45%);
  border-top-color: rgba(211, 47, 47, 0.35);
}

.footer-content {
  max-width: 1160px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon {
  font-size: 24px;
}

.status-text strong {
  display: block;
  font-size: 15px;
  color: #1a2e25;
}

.status-text p {
  margin: 0;
  font-size: 13px;
  color: #5d7a6e;
}

.result-status.ok .status-icon {
  color: #2e7d32;
}
.result-status.bad .status-icon {
  color: #d32f2f;
}
.result-status.ok strong {
  color: #2e7d32;
}
.result-status.bad strong {
  color: #d32f2f;
}

.next-btn {
  padding: 12px 34px;
  background: linear-gradient(135deg, #3b8b61, #2f6a4f);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(47, 106, 79, 0.28);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  white-space: nowrap;
}

.next-btn:active {
  transform: scale(0.95);
}

.secondary-btn-small {
  padding: 10px 18px;
  background: linear-gradient(180deg, #fffdf4, #f2ecdd);
  color: #24583f;
  border: 1px solid rgba(47, 106, 79, 0.45);
  border-radius: 12px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
}

.secondary-btn-small:active {
  transform: scale(0.95);
}

.secondary-btn-small:hover {
  border-color: rgba(47, 106, 79, 0.7);
  box-shadow: 0 6px 14px rgba(47, 106, 79, 0.12);
}

.next-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(47, 106, 79, 0.3);
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .sticky-footer {
    padding-left: clamp(24px, 4vw, 40px);
    padding-right: clamp(24px, 4vw, 40px);
  }

  .stage-nav .mobile-header {
    display: none;
  }
}

@media (max-width: 640px) {
  .stage-nav {
    padding: 12px;
  }

  .stage-nav-content {
    flex-direction: column;
    align-items: stretch;
  }

  .stage-nav label {
    flex-direction: column;
    align-items: flex-start;
  }

  .stage-nav select {
    width: 100%;
  }

  .stage-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .ghost-btn {
    width: 100%;
  }

  .footer-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}

/* Result Card */
.stage-result-card {
  background: #fffdf1;
  padding: 40px;
  border-radius: 32px;
  text-align: center;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.06);
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
</style>
