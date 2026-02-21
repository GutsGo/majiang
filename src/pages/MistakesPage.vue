<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import QuestionCard from '@/components/QuestionCard.vue';
import { useTrainingStore } from '@/app/stores/useTrainingStore';
import { evaluateAnswer } from '@/modules/training/evaluator';
import { clearMistakes } from '@/modules/training/storage';
import type { UserAnswerRecord } from '@/types/training';

const store = useTrainingStore();

const currentIndex = ref(0);
const selectedOptionIds = ref<string[]>([]);
const submitted = ref(false);
const lastCorrect = ref<boolean | null>(null);
const startAt = ref(Date.now());

const mistakeQuestions = computed(() =>
  store.progress.mistakeQuestionIds
    .map((id) => store.questionsById[id])
    .filter((item) => item)
);

const currentQuestion = computed(() => mistakeQuestions.value[currentIndex.value]);

watch(mistakeQuestions, () => {
  if (currentIndex.value >= mistakeQuestions.value.length) {
    currentIndex.value = 0;
  }
});

const submit = () => {
  if (!currentQuestion.value || submitted.value) return;
  const result = evaluateAnswer(currentQuestion.value.id, selectedOptionIds.value);
  submitted.value = true;
  lastCorrect.value = result.isCorrect;

  const record: UserAnswerRecord = {
    questionId: currentQuestion.value.id,
    selectedOptionIds: selectedOptionIds.value,
    isCorrect: result.isCorrect,
    elapsedMs: Date.now() - startAt.value,
    mode: 'mistake',
    createdAt: new Date().toISOString()
  };
  store.recordAnswer(record);

  if (result.isCorrect) {
    const next = {
      ...store.progress,
      mistakeQuestionIds: store.progress.mistakeQuestionIds.filter((id) => id !== currentQuestion.value?.id)
    };
    store.updateProgress(next);
  }
};

const next = () => {
  if (!mistakeQuestions.value.length) return;
  currentIndex.value = (currentIndex.value + 1) % mistakeQuestions.value.length;
  selectedOptionIds.value = [];
  submitted.value = false;
  lastCorrect.value = null;
  startAt.value = Date.now();
};

const clearAll = () => {
  const next = clearMistakes();
  store.updateProgress(next);
};
</script>

<template>
  <section class="panel mistakes-page">
    <header>
      <h2>错题本复训</h2>
      <p>答对会自动移出错题本，直到清空。</p>
    </header>

    <div v-if="!mistakeQuestions.length" class="empty">
      <p>当前没有错题，去闯关继续训练吧。</p>
    </div>

    <template v-else>
      <div class="actions">
        <span>共 {{ mistakeQuestions.length }} 题</span>
        <button type="button" @click="clearAll">清空错题本</button>
      </div>

      <QuestionCard
        v-if="currentQuestion"
        :question="currentQuestion"
        v-model:selected-option-ids="selectedOptionIds"
        :submitted="submitted"
        submit-label="提交复训"
        @submit="submit"
      />

      <div class="result" v-if="submitted && lastCorrect !== null">
        <strong :class="lastCorrect ? 'ok' : 'bad'">
          {{ lastCorrect ? '复训通过，已移出错题本。' : '复训仍错误，建议复习口诀后再战。' }}
        </strong>
        <button type="button" @click="next">下一题</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.mistakes-page {
  display: grid;
  gap: 14px;
}

header h2 {
  margin: 0;
  color: #27483a;
}

header p {
  margin: 8px 0 0;
  color: #577969;
}

.actions,
.result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.actions button,
.result button {
  min-height: 44px;
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  background: #2f6a4f;
  color: #fff;
}

.ok {
  color: #2f6b4f;
}

.bad {
  color: #aa5f53;
}
</style>
