<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
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

const recentMistakes = computed(() => store.progress.mistakeQuestionIds.slice(0, 6));
</script>

<template>
  <section class="home-grid">
    <article class="hero panel">
      <div class="hero-actions">
        <RouterLink class="game-cta cta-explain" to="/explain">
          <strong>进入讲解模式</strong>
          <small>START EXPLAIN</small>
        </RouterLink>
        <RouterLink class="game-cta cta-challenge" to="/challenge">
          <strong>进入闯关模式</strong>
          <small>START CHALLENGE</small>
        </RouterLink>
        <RouterLink class="game-cta cta-kouji" to="/kouji">
          <strong>进入口技学习</strong>
          <small>START KOUJI</small>
        </RouterLink>
        <RouterLink class="game-cta cta-mistakes" to="/mistakes">
          <strong>进入错题本</strong>
          <small>START REVIEW</small>
        </RouterLink>
      </div>
    </article>

    <article class="panel stats">
      <header>
        <img :src="appLogo" alt="站点 Logo" />
        <h2>今日训练概览</h2>
      </header>
      <ul>
        <li>今日答题：{{ store.todayAnswerCount }} 题</li>
        <li>累计答题：{{ store.totalAnswered }} 题</li>
        <li>累计正确率：{{ Math.round(store.accuracy * 100) }}%</li>
        <li>题库总量：{{ store.questionStats.total }} 题</li>
      </ul>
    </article>

    <article class="panel stage-progress">
      <h2>五阶段进度</h2>
      <div class="stage-list">
        <div class="stage-item" v-for="item in stageRate" :key="item.stageId">
          <strong>{{ stageMeta[item.stageId as keyof typeof stageMeta].name }}</strong>
          <p>{{ item.done }} / {{ item.total }} 题</p>
          <div class="bar"><span :style="{ width: `${item.percent}%` }" /></div>
        </div>
      </div>
    </article>

    <article class="panel mistakes">
      <div class="mistake-head">
        <h2>最近错题</h2>
        <RouterLink to="/mistakes">进入错题本</RouterLink>
      </div>
      <ul v-if="recentMistakes.length" class="mistake-list">
        <li v-for="id in recentMistakes" :key="id">{{ id }}</li>
      </ul>
      <p v-else>暂无错题，继续保持。</p>
    </article>
  </section>
</template>

<style scoped>
.home-grid {
  display: grid;
  gap: 16px;
}

.hero {
  display: grid;
  gap: 12px;
}

.hero-head h1 {
  margin: 0;
  font-size: clamp(28px, 6vw, 40px);
  color: #1f4134;
}

.hero-head p {
  margin: 8px 0 0;
  color: #597d6b;
  font-weight: 600;
}

.hero-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.game-cta {
  position: relative;
  overflow: hidden;
  min-height: 96px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  color: #fff;
  text-decoration: none;
  padding: 14px 16px;
  display: grid;
  align-content: center;
  gap: 4px;
  box-shadow: 0 14px 24px rgba(13, 26, 20, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.15s ease;
}

.game-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.22), transparent 34%, transparent 64%, rgba(255, 255, 255, 0.12));
  pointer-events: none;
}

.game-cta strong {
  font-size: clamp(18px, 2.8vw, 22px);
  line-height: 1.15;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 0 rgba(23, 37, 30, 0.45);
}

.game-cta small {
  font-size: 11px;
  letter-spacing: 0.12em;
  opacity: 0.88;
}

.game-cta:hover {
  transform: translateY(-2px) scale(1.01);
  filter: saturate(1.08);
  box-shadow: 0 20px 30px rgba(13, 26, 20, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.game-cta:active {
  transform: translateY(1px) scale(0.995);
}

.game-cta:focus-visible {
  outline: 3px solid rgba(255, 249, 207, 0.9);
  outline-offset: 2px;
}

.cta-explain {
  background: linear-gradient(140deg, #599fdb, #2a5f9f 70%);
}

.cta-challenge {
  background: linear-gradient(140deg, #62ae6e, #2f7441 70%);
}

.cta-kouji {
  background: linear-gradient(140deg, #a683de, #6b45a9 70%);
}

.cta-mistakes {
  background: linear-gradient(140deg, #e38262, #ad4b35 70%);
}

.stats header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats img {
  width: 42px;
  height: 42px;
}

.stats h2,
.stage-progress h2,
.mistakes h2 {
  margin: 0;
  color: #28483a;
}

.stats ul,
.mistake-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #4f7260;
  display: grid;
  gap: 6px;
}

.stage-list {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.stage-item {
  padding: 10px;
  border-radius: 12px;
  background: rgba(245, 240, 219, 0.75);
}

.stage-item strong {
  color: #335646;
}

.stage-item p {
  margin: 6px 0;
  color: #5a7d6c;
}

.bar {
  height: 8px;
  border-radius: 999px;
  background: #dcebdc;
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #6cb793, #3f8e68);
}

.mistake-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mistake-head a {
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #4a936f, #2e6a4e);
  color: #fff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

@media (max-width: 640px) {
  .hero-actions {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 960px) {
  .home-grid {
    grid-template-columns: 2fr 1fr;
  }

  .hero,
  .stage-progress {
    grid-column: 1 / 2;
  }

  .stats,
  .mistakes {
    grid-column: 2 / 3;
  }

  .hero {
    align-content: start;
  }
}
</style>
