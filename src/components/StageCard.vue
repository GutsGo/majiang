<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  description: string;
  unlocked: boolean;
  difficulty: 1 | 2 | 3;
  completionStars: number;
}>();

const badgeText = computed(() => {
  if (!props.unlocked) return '未解锁';
  if (props.completionStars <= 0) return '未完成';
  return `通关 ${props.completionStars}★`;
});
</script>

<template>
  <article :class="['stage-card', { locked: !props.unlocked }]">
    <span
      class="status-badge"
      :class="{
        locked: !props.unlocked,
        pending: props.unlocked && props.completionStars <= 0,
        done: props.unlocked && props.completionStars > 0,
      }"
    >
      {{ badgeText }}
    </span>
    <h4>{{ props.title }}</h4>
    <p>{{ props.description }}</p>
    <div class="meta">
      <span>{{ props.unlocked ? '已解锁' : '未解锁' }}</span>
      <span class="star-row">
        难度：
        <span class="stars" aria-label="难度">
          <span
            v-for="i in 3"
            :key="i"
            :class="['star', { filled: i <= props.difficulty }]"
          >
            ★
          </span>
        </span>
      </span>
    </div>
  </article>
</template>

<style scoped>
.stage-card {
  position: relative;
  border-radius: 18px;
  border: 1px solid rgba(57, 95, 79, 0.22);
  background: #fffdf6;
  padding: 14px;
  cursor: pointer;
  min-height: 44px;
  overflow: hidden;
}

.stage-card.locked {
  opacity: 0.55;
  cursor: not-allowed;
}

.stage-card h4 {
  margin: 0;
  color: #2a493b;
}

.stage-card p {
  margin: 8px 0;
  color: #5a7e6b;
}

.meta {
  display: flex;
  justify-content: space-between;
  color: #3d6352;
  font-size: 13px;
}

.star-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.stars {
  display: inline-flex;
  gap: 2px;
  letter-spacing: 0;
}

.star {
  color: rgba(58, 96, 80, 0.25);
  font-size: 12px;
}

.star.filled {
  color: #f4b400;
  text-shadow: 0 0 8px rgba(244, 180, 0, 0.35);
}

.status-badge {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(57, 95, 79, 0.2);
  background: #f7f4e7;
  color: #3d6352;
}

.status-badge.pending {
  background: #fff3cd;
  border-color: rgba(192, 140, 0, 0.35);
  color: #9a6a00;
}

.status-badge.done {
  background: #e6f4ea;
  border-color: rgba(47, 106, 79, 0.35);
  color: #2f6a4f;
}

.status-badge.locked {
  background: #f1f1f1;
  border-color: rgba(120, 120, 120, 0.2);
  color: #7a7a7a;
}
</style>
