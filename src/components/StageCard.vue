<script setup lang="ts">
const props = defineProps<{
  title: string;
  description: string;
  unlocked: boolean;
  stars: number;
}>();
</script>

<template>
  <article :class="['stage-card', { locked: !props.unlocked }]">
    <h4>{{ props.title }}</h4>
    <p>{{ props.description }}</p>
    <div class="meta">
      <span>{{ props.unlocked ? '已解锁' : '未解锁' }}</span>
      <span>星级：{{ '★'.repeat(props.stars) || '☆' }}</span>
    </div>
  </article>
</template>

<style scoped>
.stage-card {
  border-radius: 18px;
  border: 1px solid rgba(57, 95, 79, 0.22);
  background: #fffdf6;
  padding: 14px;
  cursor: pointer;
  min-height: 44px;
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
</style>
