<script setup lang="ts">
import { computed } from 'vue';
import { useTrainingStore } from '@/app/stores/useTrainingStore';
import { stageMeta } from '@/data/rules';
import type { RuleStageId } from '@/types/training';

const store = useTrainingStore();
const appLogo = '/logo.webp';

const stageRate = computed(() => {
  const stageIds = Object.keys(store.questionStats.byStage) as RuleStageId[];
  const result = stageIds.map((stageId) => {
    const total = store.questionStats.byStage[stageId];
    const done = store.stageProgressMap[stageId] ?? 0;
    return {
      stageId,
      total,
      done,
      percent: total === 0 ? 0 : Math.round((done / total) * 100)
    };
  });
  return result;
});
</script>

<template>
  <div class="progress-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <span class="icon">←</span> 返回
      </button>
      <h1>训练进度详情</h1>
    </header>

    <div class="content-grid">
      <article class="panel stats-panel">
        <header>
          <img :src="appLogo" alt="站点 Logo" />
          <h2>今日训练概览</h2>
        </header>
        <ul class="stats-list">
          <li>
            <span class="label">今日答题</span>
            <span class="value">{{ store.todayAnswerCount }} 题</span>
          </li>
          <li>
            <span class="label">累计答题</span>
            <span class="value">{{ store.totalAnswered }} 题</span>
          </li>
          <li>
            <span class="label">累计正确率</span>
            <span class="value high">{{ Math.round(store.accuracy * 100) }}%</span>
          </li>
          <li>
            <span class="label">题库总量</span>
            <span class="value">{{ store.questionStats.total }} 题</span>
          </li>
        </ul>
      </article>

      <article class="panel stage-progress">
        <h2>五阶段进度</h2>
        <div class="stage-list">
          <div class="stage-item" v-for="item in stageRate" :key="item.stageId">
            <div class="stage-info">
              <strong class="stage-name">{{ stageMeta[item.stageId as keyof typeof stageMeta].name }}</strong>
              <span class="stage-count">{{ item.done }} / {{ item.total }} 题</span>
            </div>
            <div class="bar-container">
              <div class="bar"><span :style="{ width: `${item.percent}%` }" /></div>
              <span class="percent-label">{{ item.percent }}%</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.progress-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 99px;
  background: #f7f4e7;
  border: 1px solid rgba(58, 96, 80, 0.2);
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s ease;
  color: #2c4e3f;
}

.back-btn:hover {
  background: #f5f5f5;
  transform: translateX(-4px);
}

.page-header h1 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0;
}

.content-grid {
  display: grid;
  gap: 24px;
}

.panel {
  background: #fffdf1;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(47, 106, 79, 0.08);
  border: 1px solid rgba(58, 96, 80, 0.1);
}

.stats-panel header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.stats-panel img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.stats-panel h2 {
  margin: 0;
  font-size: 20px;
  color: #2c3e50;
}

.stats-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
}

.stats-list li {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 14px;
  color: #7f8c8d;
}

.value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
}

.value.high {
  color: #27ae60;
}

.stage-progress h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #2c3e50;
}

.stage-list {
  display: grid;
  gap: 16px;
}

.stage-item {
  padding: 16px;
  background: #f7f4e7;
  border-radius: 16px;
  border: 1px solid rgba(58, 96, 80, 0.1);
}

.stage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stage-name {
  font-size: 16px;
  color: #2c3e50;
}

.stage-count {
  font-size: 14px;
  color: #7f8c8d;
}

.bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar {
  flex: 1;
  height: 10px;
  background: rgba(47, 106, 79, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #42b883, #34495e);
  border-radius: 5px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.percent-label {
  font-size: 14px;
  font-weight: 600;
  color: #42b883;
  min-width: 40px;
}
</style>
