<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QuestionCard from '@/components/QuestionCard.vue';
import RulePill from '@/components/RulePill.vue';
import { useTrainingStore } from '@/app/stores/useTrainingStore';
import { evaluateAnswer } from '@/modules/training/evaluator';
import type { QuestionType, RuleStageId, UserAnswerRecord } from '@/types/training';

const route = useRoute();
const router = useRouter();
const store = useTrainingStore();

const stageFilter = ref<RuleStageId | 'all'>('all');
const typeFilter = ref<QuestionType | 'all'>('all');
const questionIndex = ref(0);

const selectedOptionIds = ref<string[]>([]);
const submitted = ref(false);
const lastCorrect = ref<boolean | null>(null);
const questionStartAt = ref(Date.now());

const filteredQuestions = computed(() =>
  store.trainingQuestions.filter((question) => {
    if (stageFilter.value !== 'all' && question.stageId !== stageFilter.value) return false;
    if (typeFilter.value !== 'all' && question.type !== typeFilter.value) return false;
    return true;
  })
);

const currentQuestion = computed(() => filteredQuestions.value[questionIndex.value] ?? null);

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
  const safeIndex = ((index % filteredQuestions.value.length) + filteredQuestions.value.length) % filteredQuestions.value.length;
  questionIndex.value = safeIndex;
  resetQuestionState();

  const target = filteredQuestions.value[safeIndex];
  if (target) {
    syncRouteQuestion(target.id);
  }
};

watch(filteredQuestions, () => {
  if (!filteredQuestions.value.length) {
    questionIndex.value = 0;
    resetQuestionState();
    return;
  }

  const queryId = route.query.questionId as string | undefined;
  const queryIndex = queryId ? filteredQuestions.value.findIndex((question) => question.id === queryId) : -1;
  const firstUnansweredIndex = filteredQuestions.value.findIndex(
    (question) => !store.answeredQuestionIdSet.has(question.id)
  );
  const nextIndex = queryIndex >= 0 ? queryIndex : firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
  goToQuestionIndex(nextIndex);
}, { immediate: true });

watch(() => route.query.questionId, (questionId) => {
  if (!questionId || !filteredQuestions.value.length) return;
  const index = filteredQuestions.value.findIndex((question) => question.id === questionId);
  if (index < 0 || index === questionIndex.value) return;
  goToQuestionIndex(index);
});

const relatedQuestions = computed(() => {
  if (!currentQuestion.value) return [];
  const question = currentQuestion.value;
  const firstRule = question.ruleRefs[0];
  return store.trainingQuestions
    .filter((item) => item.id !== question.id && (item.ruleRefs.includes(firstRule) || item.stageId === question.stageId))
    .slice(0, 4);
});

const ruleTags = computed(() => {
  if (!currentQuestion.value) return [];
  const refs = new Set(currentQuestion.value.ruleRefs);
  return store.ruleTagsWithExamples.filter((rule) => refs.has(rule.id));
});

const submitAnswer = () => {
  if (!currentQuestion.value || submitted.value) return;
  const evaluation = evaluateAnswer(currentQuestion.value.id, selectedOptionIds.value);
  submitted.value = true;
  lastCorrect.value = evaluation.isCorrect;

  const record: UserAnswerRecord = {
    questionId: currentQuestion.value.id,
    selectedOptionIds: selectedOptionIds.value,
    isCorrect: evaluation.isCorrect,
    elapsedMs: Date.now() - questionStartAt.value,
    mode: 'explain',
    createdAt: new Date().toISOString()
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
  const index = filteredQuestions.value.findIndex((question) => question.id === questionId);
  if (index === -1) return;
  goToQuestionIndex(index);
};

const restartFromFirst = () => {
  goToQuestionIndex(0);
};

const currentQuestionId = computed({
  get: () => currentQuestion.value?.id ?? '',
  set: (questionId: string) => jumpToQuestion(questionId)
});

const stageOptions: Array<RuleStageId | 'all'> = ['all', 'opening', 'midgame', 'meld', 'defense', 'listening'];
const typeOptions: Array<QuestionType | 'all'> = ['all', 'discard_best', 'wait_tiles', 'safe_discard', 'peng_or_pass', 'dingque_or_huansan'];
</script>

<template>
  <section class="panel explain-trainer">
    <header class="panel-head">
      <h2>讲解模式</h2>
      <p>先作答，再学习口诀与推理路径。</p>
    </header>

    <div class="filters">
      <label>
        阶段筛选
        <select v-model="stageFilter">
          <option v-for="item in stageOptions" :key="item" :value="item">
            {{ item === 'all' ? '全部阶段' : item }}
          </option>
        </select>
      </label>
      <label>
        题型筛选
        <select v-model="typeFilter">
          <option v-for="item in typeOptions" :key="item" :value="item">
            {{ item === 'all' ? '全部题型' : item }}
          </option>
        </select>
      </label>
      <small>当前题库 {{ filteredQuestions.length }} 题</small>
    </div>

    <div v-if="currentQuestion" class="question-nav">
      <span>第 {{ questionIndex + 1 }} / {{ filteredQuestions.length }} 题</span>
      <label>
        选择题目
        <select v-model="currentQuestionId">
          <option v-for="(item, index) in filteredQuestions" :key="item.id" :value="item.id">
            第{{ index + 1 }}题 · {{ item.id }}
          </option>
        </select>
      </label>
      <div class="nav-actions">
        <button type="button" class="ghost-btn" @click="skipQuestion">跳过本题</button>
        <button type="button" class="ghost-btn" @click="restartFromFirst">重新开始</button>
      </div>
    </div>

    <p v-if="!currentQuestion" class="empty-state">当前筛选暂无题目。</p>

    <QuestionCard
      v-if="currentQuestion"
      :question="currentQuestion"
      v-model:selected-option-ids="selectedOptionIds"
      :submitted="submitted"
      submit-label="提交并查看讲解"
      @submit="submitAnswer"
    />

    <div class="result" v-if="submitted && lastCorrect !== null">
      <strong :class="lastCorrect ? 'ok' : 'bad'">
        {{ lastCorrect ? '回答正确，继续巩固。' : '回答有误，先看口诀再下一题。' }}
      </strong>
      <button type="button" class="next-btn" @click="nextQuestion">下一题</button>
    </div>

    <section class="rule-grid" v-if="ruleTags.length">
      <h3>本题关联口诀</h3>
      <div class="rules">
        <RulePill v-for="rule in ruleTags" :key="rule.id" :rule="rule" />
      </div>
    </section>

    <section class="related" v-if="relatedQuestions.length">
      <h3>同类题推荐</h3>
      <div class="related-list">
        <button v-for="item in relatedQuestions" :key="item.id" type="button" @click="jumpToQuestion(item.id)">
          {{ item.prompt }}
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.explain-trainer {
  display: grid;
  gap: 16px;
}

.panel-head h2 {
  margin: 0;
  color: #1f3c31;
}

.panel-head p {
  margin: 8px 0 0;
  color: #567a68;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
}

.filters label {
  display: grid;
  gap: 6px;
  color: #355a48;
  font-weight: 600;
}

.question-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  color: #355a48;
}

.question-nav label {
  display: grid;
  gap: 6px;
  font-weight: 600;
}

.nav-actions {
  display: flex;
  gap: 8px;
}

select {
  min-height: 44px;
  min-width: 160px;
  border-radius: 10px;
  border: 1px solid rgba(58, 96, 80, 0.3);
  padding: 0 10px;
}

.ghost-btn {
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(47, 106, 79, 0.35);
  background: #fff;
  color: #2f6a4f;
  padding: 10px 14px;
}

.empty-state {
  margin: 0;
  color: #58796a;
}

.result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(56, 93, 77, 0.35);
  padding: 12px;
}

.ok {
  color: #2f6b4f;
}

.bad {
  color: #a3584f;
}

.next-btn {
  min-height: 44px;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: #2f6a4f;
  color: #fff;
}

.rule-grid,
.related {
  display: grid;
  gap: 10px;
}

.rule-grid h3,
.related h3 {
  margin: 0;
  color: #2b4a3d;
}

.rules {
  display: grid;
  gap: 10px;
}

.related-list {
  display: grid;
  gap: 8px;
}

.related-list button {
  text-align: left;
  border-radius: 12px;
  border: 1px solid rgba(53, 90, 74, 0.2);
  background: rgba(248, 244, 228, 0.8);
  padding: 10px;
  min-height: 44px;
}
</style>
