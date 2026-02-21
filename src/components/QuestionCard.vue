<script setup lang="ts">
import { computed } from 'vue';
import MahjongTile from '@/components/MahjongTile.vue';
import type { TrainingQuestion } from '@/types/training';

const props = withDefaults(
  defineProps<{
    question: TrainingQuestion;
    selectedOptionIds: string[];
    submitted: boolean;
    submitLabel?: string;
    showExplanation?: boolean;
    disabled?: boolean;
  }>(),
  {
    submitLabel: '提交答案',
    showExplanation: true,
    disabled: false
  }
);

const emit = defineEmits<{
  'update:selectedOptionIds': [value: string[]];
  submit: [];
}>();

const optionIdSet = computed(() => new Set(props.selectedOptionIds));
const answerIdSet = computed(() => new Set(props.question.correctOptionIds));

const toggleOption = (optionId: string) => {
  if (props.submitted || props.disabled) return;

  if (!props.question.multiSelect) {
    emit('update:selectedOptionIds', [optionId]);
    return;
  }

  const current = new Set(props.selectedOptionIds);
  if (current.has(optionId)) {
    current.delete(optionId);
  } else {
    current.add(optionId);
  }
  emit('update:selectedOptionIds', Array.from(current));
};

const optionClass = (optionId: string) => {
  if (!props.submitted) {
    return optionIdSet.value.has(optionId) ? 'selected' : '';
  }

  if (answerIdSet.value.has(optionId)) return 'correct';
  if (optionIdSet.value.has(optionId)) return 'wrong';
  return '';
};

const canSubmit = computed(() => props.selectedOptionIds.length > 0 && !props.submitted && !props.disabled);
</script>

<template>
  <article class="question-card">
    <header class="question-header">
      <h3>{{ props.question.prompt }}</h3>
      <p>{{ props.question.multiSelect ? '多选题，可选择多个答案' : '单选题' }}</p>
    </header>

    <section class="tile-board">
      <div class="tile-group">
        <h4>手牌</h4>
        <div class="tiles">
          <MahjongTile
            v-for="(tile, index) in props.question.hand"
            :key="`${props.question.id}-${tile}-${index}`"
            :tile="tile"
          />
        </div>
      </div>

      <div v-if="props.question.discards?.length" class="tile-group">
        <h4>桌面弃牌</h4>
        <div class="tiles compact-tiles">
          <MahjongTile
            v-for="(tile, index) in props.question.discards"
            :key="`${props.question.id}-discard-${tile}-${index}`"
            :tile="tile"
            compact
          />
        </div>
      </div>
    </section>

    <section class="options">
      <button
        v-for="option in props.question.options"
        :key="option.id"
        type="button"
        :class="['option-item', optionClass(option.id)]"
        @click="toggleOption(option.id)"
      >
        <span>{{ option.id }}. {{ option.label }}</span>
        <small v-if="option.note">{{ option.note }}</small>
      </button>
    </section>

    <button class="submit-btn" type="button" :disabled="!canSubmit" @click="emit('submit')">
      {{ props.submitLabel }}
    </button>

    <section v-if="props.submitted && props.showExplanation" class="explain">
      <h4>解题讲解</h4>
      <ol>
        <li v-for="step in props.question.explanationSteps" :key="step.id">
          <strong>{{ step.title }}</strong>
          <p>{{ step.detail }}</p>
        </li>
      </ol>
      <p class="pitfall">常见误区：{{ props.question.pitfalls.join('；') }}</p>
    </section>
  </article>
</template>

<style scoped>
.question-card {
  border-radius: 20px;
  border: 1px solid rgba(54, 84, 70, 0.22);
  background: #fffef9;
  box-shadow: 0 14px 30px rgba(34, 58, 49, 0.1);
  padding: 16px;
  display: grid;
  gap: 16px;
}

.question-header h3 {
  margin: 0;
  color: #1f3d31;
  font-size: 20px;
}

.question-header p {
  margin: 8px 0 0;
  color: #58796a;
}

.tile-board {
  display: grid;
  gap: 12px;
}

.tile-group h4 {
  margin: 0 0 8px;
  color: #335346;
}

.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.compact-tiles {
  gap: 6px;
}

.options {
  display: grid;
  gap: 10px;
}

.option-item {
  border: 1px solid rgba(58, 96, 80, 0.25);
  border-radius: 14px;
  background: #f7f4e7;
  color: #284436;
  padding: 12px;
  text-align: left;
  display: grid;
  gap: 4px;
  min-height: 44px;
}

.option-item.selected {
  border-color: #3f7a60;
  background: #e4f3e8;
}

.option-item.correct {
  border-color: #348552;
  background: #dff6e5;
}

.option-item.wrong {
  border-color: #d16e62;
  background: #fde9e5;
}

.submit-btn {
  width: fit-content;
  min-height: 44px;
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #4f9474, #2f6a4f);
  color: #fff;
  font-weight: 700;
}

.submit-btn:disabled {
  opacity: 0.5;
}

.explain {
  border-top: 1px dashed rgba(52, 82, 68, 0.3);
  padding-top: 12px;
}

.explain h4 {
  margin: 0 0 8px;
  color: #2b4c3d;
}

.explain ol {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 8px;
}

.explain li p {
  margin: 4px 0 0;
  color: #4e6f60;
}

.pitfall {
  margin: 12px 0 0;
  color: #6a4e49;
  font-weight: 600;
}
</style>
