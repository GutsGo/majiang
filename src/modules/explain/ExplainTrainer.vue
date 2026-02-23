<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMediaQuery } from '@vueuse/core';
import QuestionCard from '@/components/QuestionCard.vue';
import RulePill from '@/components/RulePill.vue';
import { useTrainingStore } from '@/app/stores/useTrainingStore';
import { evaluateAnswer } from '@/modules/training/evaluator';
import type {
  QuestionType,
  RuleStageId,
  UserAnswerRecord,
} from '@/types/training';

const route = useRoute();
const router = useRouter();
const store = useTrainingStore();

const stageFilter = ref<RuleStageId | 'all'>('all');
const typeFilter = ref<QuestionType | 'all'>('all');
const questionIndex = ref(0);
const showFilters = ref(false);
const isLargeScreen = useMediaQuery('(min-width: 768px)');

const selectedOptionIds = ref<string[]>([]);
const submitted = ref(false);
const lastCorrect = ref<boolean | null>(null);
const questionStartAt = ref(Date.now());

const filteredQuestions = computed(() =>
  store.trainingQuestions.filter((question) => {
    if (stageFilter.value !== 'all' && question.stageId !== stageFilter.value)
      return false;
    if (typeFilter.value !== 'all' && question.type !== typeFilter.value)
      return false;
    return true;
  }),
);

const currentQuestion = computed(
  () => filteredQuestions.value[questionIndex.value] ?? null,
);

const resetQuestionState = () => {
  selectedOptionIds.value = [];
  submitted.value = false;
  lastCorrect.value = null;
  questionStartAt.value = Date.now();
};

const syncRouteQuestion = (questionId: string) => {
  if (route.query.questionId === questionId) return;
  router.replace({ query: { ...route.query, questionId } });
};

const goToQuestionIndex = (index: number) => {
  if (!filteredQuestions.value.length) return;
  const safeIndex =
    ((index % filteredQuestions.value.length) +
      filteredQuestions.value.length) %
    filteredQuestions.value.length;
  questionIndex.value = safeIndex;
  resetQuestionState();

  const target = filteredQuestions.value[safeIndex];
  if (target) {
    syncRouteQuestion(target.id);
  }
};

watch(
  filteredQuestions,
  () => {
    if (!filteredQuestions.value.length) {
      questionIndex.value = 0;
      resetQuestionState();
      return;
    }

    const queryId = route.query.questionId as string | undefined;
    const queryIndex = queryId
      ? filteredQuestions.value.findIndex((question) => question.id === queryId)
      : -1;
    const firstUnansweredIndex = filteredQuestions.value.findIndex(
      (question) => !store.answeredQuestionIdSetByMode.explain.has(question.id),
    );
    const nextIndex =
      queryIndex >= 0
        ? queryIndex
        : firstUnansweredIndex >= 0
          ? firstUnansweredIndex
          : 0;
    goToQuestionIndex(nextIndex);
  },
  { immediate: true },
);

watch(
  () => route.query.questionId,
  (questionId) => {
    if (!questionId || !filteredQuestions.value.length) return;
    const index = filteredQuestions.value.findIndex(
      (question) => question.id === questionId,
    );
    if (index < 0 || index === questionIndex.value) return;
    goToQuestionIndex(index);
  },
);

const relatedQuestions = computed(() => {
  if (!currentQuestion.value) return [];
  const question = currentQuestion.value;
  const firstRule = question.ruleRefs[0];
  return store.trainingQuestions
    .filter(
      (item) =>
        item.id !== question.id &&
        (item.ruleRefs.includes(firstRule) ||
          item.stageId === question.stageId),
    )
    .slice(0, 4);
});

const ruleTags = computed(() => {
  if (!currentQuestion.value) return [];
  const refs = new Set(currentQuestion.value.ruleRefs);
  return store.ruleTagsWithExamples.filter((rule) => refs.has(rule.id));
});

const submitAnswer = () => {
  if (!currentQuestion.value || submitted.value) return;
  const evaluation = evaluateAnswer(
    currentQuestion.value.id,
    selectedOptionIds.value,
  );
  submitted.value = true;
  lastCorrect.value = evaluation.isCorrect;

  const record: UserAnswerRecord = {
    questionId: currentQuestion.value.id,
    selectedOptionIds: selectedOptionIds.value,
    isCorrect: evaluation.isCorrect,
    elapsedMs: Date.now() - questionStartAt.value,
    mode: 'explain',
    createdAt: new Date().toISOString(),
  };

  store.recordAnswer(record);
};

const nextQuestion = () => {
  if (!filteredQuestions.value.length) return;
  goToQuestionIndex(questionIndex.value + 1);
};

const skipQuestion = () => {
  nextQuestion();
};

const jumpToQuestion = (questionId: string) => {
  const index = filteredQuestions.value.findIndex(
    (question) => question.id === questionId,
  );
  if (index === -1) return;
  goToQuestionIndex(index);
};

const restartFromFirst = () => {
  goToQuestionIndex(0);
};

const scrollToExplanation = () => {
  const el = document.querySelector('.explain-card');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const currentQuestionId = computed({
  get: () => currentQuestion.value?.id ?? '',
  set: (questionId: string) => jumpToQuestion(questionId),
});

const stageOptions: Array<RuleStageId | 'all'> = [
  'all',
  'opening',
  'midgame',
  'meld',
  'defense',
  'listening',
];
const typeOptions: Array<QuestionType | 'all'> = [
  'all',
  'discard_best',
  'wait_tiles',
  'safe_discard',
  'peng_or_pass',
  'dingque_or_huansan',
  'judge_pattern',
  'true_false',
  'analyze_situation',
  'choose_strategy',
];

const stageLabels: Record<RuleStageId | 'all', string> = {
  all: '全部',
  opening: '起手配牌',
  midgame: '中局进阶',
  meld: '碰杠决策',
  defense: '防守反进',
  listening: '听牌博弈',
};

const typeLabels: Record<QuestionType | 'all', string> = {
  all: '全部',
  discard_best: '舍牌最优',
  wait_tiles: '听牌面',
  safe_discard: '安全舍牌',
  peng_or_pass: '碰牌策略',
  dingque_or_huansan: '定缺换三',
  judge_pattern: '牌型判断',
  true_false: '是非题',
  analyze_situation: '局势分析',
  choose_strategy: '局势分析',
};
</script>

<template>
  <section class="explain-trainer">
    <header class="page-header">
      <div class="title-section">
        <span class="mode-icon">📖</span>
        <div class="text">
          <h2>讲解模式</h2>
          <p>深度解析，掌握麻将口诀之秘</p>
        </div>
      </div>
    </header>

    <div class="control-bar" :class="{ collapsed: !showFilters }">
      <div class="mobile-header" @click="showFilters = !showFilters">
        <div class="current-progress">
          <span class="idx">第 {{ questionIndex + 1 }} /
            {{ filteredQuestions.length }} 题</span>
          <span class="type-badge" v-if="currentQuestion">{{
            currentQuestion.stageId
            }}</span>
        </div>
        <button class="toggle-btn">
          {{ showFilters ? '收起设置' : '调整设置' }}
        </button>
      </div>

      <div class="control-content" v-show="showFilters || isLargeScreen">
        <div class="filter-group">
          <label>
            <span>阶段</span>
            <select v-model="stageFilter" class="style-select">
              <option v-for="item in stageOptions" :key="item" :value="item">
                {{ stageLabels[item] }}
              </option>
            </select>
          </label>
          <label>
            <span>题型</span>
            <select v-model="typeFilter" class="style-select">
              <option v-for="item in typeOptions" :key="item" :value="item">
                {{ typeLabels[item] }}
              </option>
            </select>
          </label>
        </div>

        <div v-if="currentQuestion" class="nav-group">
          <div class="progress-info">
            <select v-model="currentQuestionId" class="jump-select">
              <option v-for="(item, index) in filteredQuestions" :key="item.id" :value="item.id">
                跳转至第 {{ index + 1 }} 题
              </option>
            </select>
          </div>
          <div class="btn-group">
            <button type="button" class="action-btn next-step" @click="skipQuestion">
              跳过此题
            </button>
            <button type="button" class="action-btn" @click="restartFromFirst">
              重头开始
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!currentQuestion" class="empty-state">当前筛选暂无题目。</p>

    <QuestionCard v-if="currentQuestion" :question="currentQuestion" v-model:selected-option-ids="selectedOptionIds"
      :submitted="submitted" submit-label="提交并查看讲解" @submit="submitAnswer" />

    <Transition name="slide-up">
      <div class="sticky-footer" :class="lastCorrect ? 'is-ok' : 'is-bad'" v-if="submitted && lastCorrect !== null">
        <div class="footer-content">
          <div class="result-status" :class="lastCorrect ? 'ok' : 'bad'">
            <span class="status-icon">{{ lastCorrect ? '✨' : '💡' }}</span>
            <div class="status-text">
              <strong>{{ lastCorrect ? '回答正确！' : '回答有误' }}</strong>
              <p>
                {{ lastCorrect ? '继续保持。' : '查看下方提示，吸取教训。' }}
              </p>
            </div>
          </div>
          <div class="footer-actions">
            <button type="button" class="secondary-btn" @click="scrollToExplanation">
              查看解析
            </button>
            <button type="button" class="next-btn" @click="nextQuestion">
              下一题
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <section class="rule-grid" v-if="ruleTags.length">
      <div class="section-title">
        <span class="title-bg"></span>
        <h3>本题核心口诀</h3>
      </div>
      <div class="rules-container">
        <RulePill v-for="rule in ruleTags" :key="rule.id" :rule="rule" />
      </div>
    </section>

    <section class="related" v-if="relatedQuestions.length">
      <div class="section-title">
        <span class="title-bg"></span>
        <h3>专项巩固推荐</h3>
      </div>
      <div class="related-list">
        <button v-for="item in relatedQuestions" :key="item.id" type="button" class="related-card"
          @click="jumpToQuestion(item.id)">
          <span class="prompt-text">{{ item.prompt }}</span>
          <span class="arrow">→</span>
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.explain-trainer {
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
  /* 拒绝纯白 */
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(47, 106, 79, 0.08);
  border: 1px solid rgba(58, 96, 80, 0.15);
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

/* Control Bar */
.control-bar {
  background: var(--panel-bg, #fffdf1);
  padding: 16px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--panel-border, rgba(58, 96, 80, 0.1));
  --control-select-height: 30px;
  --control-select-font-size: 13px;
}

.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.idx {
  font-weight: 800;
  color: #1a2e25;
  font-size: 16px;
}

.type-badge {
  font-size: 11px;
  padding: 2px 10px;
  background: #f1f8f5;
  color: #2f6a4f;
  border-radius: 6px;
  font-weight: 700;
  text-transform: uppercase;
}

.toggle-btn {
  font-size: 12px;
  color: #5d7a6e;
  background: #f7f4e7;
  border: 1px solid rgba(58, 96, 80, 0.15);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
}

.control-content {
  display: grid;
  gap: 16px;
}

.filter-group {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(58, 96, 80, 0.1);
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #355a48;
}

.style-select {
  background: #f7f4e7;
  border: 1px solid rgba(58, 96, 80, 0.2);
  padding: 0 8px;
  border-radius: 6px;
  font-size: var(--control-select-font-size);
  color: #2f6a4f;
  font-weight: 700;
  height: var(--control-select-height);
  line-height: calc(var(--control-select-height) - 2px);
}

.nav-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-info {
  background: #f7f4e7;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(58, 96, 80, 0.08);
  height: var(--control-select-height);
  display: flex;
  align-items: center;
}

.jump-select {
  border: none;
  background: transparent;
  font-size: var(--control-select-font-size);
  color: #2f6a4f;
  font-weight: 700;
  padding: 0 8px 0 0;
  cursor: pointer;
  height: var(--control-select-height);
  line-height: calc(var(--control-select-height) - 2px);
}

.btn-group {
  display: flex;
  gap: 12px;
  /* 增加间距，防止触控误操作 */
  margin-left: 20px;
  /* 远离左边的跳转下拉框 */
}

.action-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid rgba(58, 96, 80, 0.18);
  background: #f7f4e7;
  color: #2c4e3f;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn.next-step {
  background: #2f6a4f;
  color: white;
  border: none;
}

.action-btn:hover {
  border-color: #2f6a4f;
  background: #f1f8f5;
  color: #2f6a4f;
}

.action-btn.next-step:hover {
  background: #28543e;
  color: white;
}

/* Sections Styling */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.title-bg {
  width: 4px;
  height: 18px;
  background: #2f6a4f;
  border-radius: 2px;
}

.section-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a2e25;
}

.rule-grid,
.related {
  padding: 0 8px;
}

.rules-container {
  display: grid;
  gap: 12px;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.related-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f7f4e7;
  border: 1px solid rgba(58, 96, 80, 0.15);
  border-radius: 16px;
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
}

.related-card:hover {
  border-color: #2f6a4f;
  background: #f1ede0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.prompt-text {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e36;
}

.arrow {
  color: #2f6a4f;
  font-weight: 800;
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

.secondary-btn {
  padding: 12px 22px;
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

.secondary-btn:hover {
  border-color: rgba(47, 106, 79, 0.7);
  box-shadow: 0 6px 14px rgba(47, 106, 79, 0.12);
}

.next-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(47, 106, 79, 0.3);
}

.next-btn:active,
.secondary-btn:active {
  transform: scale(0.95);
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
  .mobile-header {
    display: none;
  }

  .control-content {
    display: flex !important;
    justify-content: space-between;
    align-items: center;
  }

  .filter-group {
    border-bottom: none;
    padding: 0;
  }

  .sticky-footer {
    padding-left: clamp(24px, 4vw, 40px);
    padding-right: clamp(24px, 4vw, 40px);
  }
}

@media (max-width: 640px) {
  .control-bar {
    padding: 12px;
  }

  .control-content {
    gap: 12px;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .filter-group label {
    justify-content: space-between;

    >span {
      flex: 0 0 30px;
    }
  }

  .style-select {
    width: 100%;
  }

  .nav-group {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .progress-info {
    width: 100%;
    height: auto;
  }

  .jump-select {
    width: 100%;
  }

  .btn-group {
    width: 100%;
    margin-left: 0;
    flex-direction: column;
    align-items: stretch;
  }

  .action-btn {
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

select {
  cursor: pointer;
}
</style>
