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
    disabled: false,
  },
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

const canSubmit = computed(
  () =>
    props.selectedOptionIds.length > 0 && !props.submitted && !props.disabled,
);
</script>

<template>
  <article class="question-card">
    <header class="question-header">
      <div class="header-decoration"></div>
      <div class="header-content">
        <h3>{{ props.question.prompt }}</h3>
        <div class="question-badge" :class="props.question.multiSelect ? 'multi' : 'single'">
          {{ props.question.multiSelect ? '多选题' : '单选题' }}
        </div>
      </div>
    </header>

    <section class="tile-board-container">
      <div class="tile-board">
        <div class="tile-group hand-group">
          <div class="group-header">
            <span class="dot"></span>
            <h4>我的手牌</h4>
          </div>
          <div class="tiles hand-tiles">
            <MahjongTile v-for="(tile, index) in props.question.hand" :key="`${props.question.id}-${tile}-${index}`"
              :tile="tile" class="tile-3d hand-tile" />
          </div>
        </div>

        <div v-if="props.question.discards?.length" class="tile-group discard-group">
          <div class="group-header">
            <span class="dot outline"></span>
            <h4>弃牌堆</h4>
          </div>
          <div class="tiles compact-tiles">
            <MahjongTile v-for="(tile, index) in props.question.discards"
              :key="`${props.question.id}-discard-${tile}-${index}`" :tile="tile" compact class="tile-3d-compact" />
          </div>
        </div>
      </div>
    </section>

    <section class="options-container">
      <div class="options-header">请选择最佳答案：</div>
      <div class="options">
        <button v-for="option in props.question.options" :key="option.id" type="button"
          :class="['option-item', optionClass(option.id)]" @click="toggleOption(option.id)">
          <div class="option-indicator">{{ option.id }}</div>
          <div class="option-content">
            <span class="label">{{ option.label }}</span>
            <small v-if="option.note">{{ option.note }}</small>
          </div>
          <div class="result-icon" v-if="props.submitted">
            <span v-if="answerIdSet.has(option.id)">✓</span>
            <span v-else-if="optionIdSet.has(option.id)">✗</span>
          </div>
        </button>
      </div>
    </section>

    <div class="submit-wrapper">
      <button class="submit-btn" type="button" :disabled="!canSubmit" @click="emit('submit')">
        {{ props.submitLabel }}
      </button>
    </div>

    <Transition name="fade-slide">
      <section v-if="props.submitted && props.showExplanation" class="explain-card">
        <div class="explain-header">
          <span class="icon">💡</span>
          <h4>答题提示与深度解析</h4>
        </div>
        <div class="explain-body">
          <div class="step-list">
            <div v-for="(step, idx) in props.question.explanationSteps" :key="step.id" class="step-item">
              <div class="step-num">{{ idx + 1 }}</div>
              <div class="step-content">
                <strong>{{ step.title }}</strong>
                <p>{{ step.detail }}</p>
              </div>
            </div>
          </div>
          <div class="pitfall-box">
            <strong>❌ 避坑指南</strong>
            <p>{{ props.question.pitfalls.join('；') }}</p>
          </div>
        </div>
      </section>
    </Transition>
  </article>
</template>

<style scoped>
.question-card {
  border-radius: 24px;
  background: #fffdf1;
  box-shadow: 0 12px 32px rgba(30, 50, 40, 0.12);
  /* 降低发光，改用偏深绿的投影 */
  padding: 0;
  display: grid;
  overflow: hidden;
  border: 1px solid rgba(47, 106, 79, 0.25);
}

/* Header Styling */
.question-header {
  position: relative;
  padding: 24px 24px 16px;
  background: linear-gradient(to bottom, #fcfaf0, #fffdf1);
}

.header-decoration {
  position: absolute;
  top: 24px;
  left: 0;
  width: 4px;
  height: 24px;
  background: #2f6a4f;
  border-radius: 0 4px 4px 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.question-header h3 {
  margin: 0;
  color: #1a2e25;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.4;
}

.question-badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.question-badge.single {
  background: #e8f5e9;
  color: #2e7d32;
}

.question-badge.multi {
  background: #fff3e0;
  color: #ef6c00;
}

/* Tile Board Styling - The "Mahjong Table" */
.tile-board-container {
  padding: 8px 16px;
}

.tile-board {
  background: #2d5a3f;
  /* Deep felt green */
  background-image:
    radial-gradient(circle at 50% 50%,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 80%),
    repeating-conic-gradient(rgba(0, 0, 0, 0.1) 0% 25%, transparent 0% 50%) 50% / 20px 20px;
  border-radius: 16px;
  padding: 20px;
  box-shadow:
    inset 0 4px 12px rgba(0, 0, 0, 0.3),
    0 4px 20px rgba(0, 0, 0, 0.1);
  display: grid;
  gap: 20px;
  border: 4px solid #1e3d2b;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.group-header .dot {
  width: 6px;
  height: 6px;
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 8px #ffd700;
}

.group-header .dot.outline {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: none;
}

.group-header h4 {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hand-tiles {
  gap: 4px;
  /* Tighter gap for hand */
}

/* 3D Effect for Tiles on the table */
.tile-3d,
.tile-3d-compact {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4));
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tile-3d:hover {
  transform: translateY(-6px) scale(1.05);
  filter: drop-shadow(0 12px 12px rgba(0, 0, 0, 0.5));
}

/* Options Styling */
.options-container {
  padding: 16px 24px;
}

.options-header {
  font-size: 13px;
  color: #5a7e6a;
  margin-bottom: 12px;
  font-weight: 600;
}

.options {
  display: grid;
  gap: 12px;
}

.option-item {
  border: 1px solid rgba(58, 96, 80, 0.25);
  border-radius: 16px;
  background: #f7f4e7;
  /* 恢复黄色底色 */
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-align: left;
}

.option-indicator {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #5d7a6e;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.option-content {
  flex-grow: 1;
  display: grid;
  gap: 2px;
}

.option-content .label {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e36;
}

.option-content small {
  font-size: 12px;
  color: #5a7e6a;
}

.option-item:hover:not(:disabled) {
  border-color: #2f6a4f;
  background: #f1ede0;
  transform: translateX(4px);
}

.option-item.selected {
  border-color: #2f6a4f;
  background: #e4f0e9;
  box-shadow: 0 4px 12px rgba(47, 106, 79, 0.1);
}

.option-item.selected .option-indicator {
  background: #28543e;
  /* 更深的绿，增加对比 */
  color: white;
}

/* Result States */
.option-item.correct {
  border-color: #34a853;
  background: #e8f5e9;
}

.option-item.correct .option-indicator {
  background: #34a853;
  color: white;
}

.option-item.wrong {
  border-color: #ea4335;
  background: #fce8e6;
}

.option-item.wrong .option-indicator {
  background: #ea4335;
  color: white;
}

.result-icon {
  font-size: 18px;
  font-weight: 800;
}

.option-item.correct .result-icon {
  color: #34a853;
}

.option-item.wrong .result-icon {
  color: #ea4335;
}

/* Submit Button */
.submit-wrapper {
  padding: 8px 24px 24px;
}

.submit-btn {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #42b983, #2f6a4f);
  color: white;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(47, 106, 79, 0.3);
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(47, 106, 79, 0.4);
}

.submit-btn:disabled {
  background: #e0e4e2;
  color: #a0a6a3;
  box-shadow: none;
  cursor: not-allowed;
}

/* Explanation Section */
.explain-card {
  margin: 0 24px 24px;
  padding: 20px;
  background: #fdfaf0;
  /* 恢复黄色底色，拒绝全白/冷灰界面 */
  border-radius: 20px;
  border: 1px solid rgba(58, 96, 80, 0.15);
}

.explain-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.explain-header h4 {
  margin: 0;
  color: #1a2e25;
  font-size: 16px;
  font-weight: 700;
}

.step-list {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}

.step-item {
  display: flex;
  gap: 12px;
}

.step-num {
  width: 24px;
  height: 24px;
  background: #2f6a4f;
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}

.step-content strong {
  display: block;
  font-size: 14px;
  color: #2c3e36;
  margin-bottom: 4px;
}

.step-content p {
  margin: 0;
  font-size: 13px;
  color: #5d7a6e;
  line-height: 1.5;
}

.pitfall-box {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  border-left: 4px solid #ea4335;
}

.pitfall-box strong {
  display: block;
  font-size: 13px;
  color: #ea4335;
  margin-bottom: 4px;
}

.pitfall-box p {
  margin: 0;
  font-size: 13px;
  color: #6a4e49;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
