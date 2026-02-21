<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { useRouter } from 'vue-router';
import { stageMeta } from '@/data/rules';
import RulePill from '@/components/RulePill.vue';
import { useTrainingStore } from '@/app/stores/useTrainingStore';
import type { RuleStageId } from '@/types/training';

const router = useRouter();
const store = useTrainingStore();

const stageFilter = ref<RuleStageId | 'all'>('all');
const favorites = useStorage<string[]>('panda-majiang-rule-favorites', []);

const filteredRules = computed(() =>
  store.ruleTagsWithExamples.filter((rule) =>
    stageFilter.value === 'all' ? true : rule.stageId === stageFilter.value
  )
);

const favoriteSet = computed(() => new Set(favorites.value));

const toggleFavorite = (ruleId: string) => {
  const next = new Set(favorites.value);
  if (next.has(ruleId)) {
    next.delete(ruleId);
  } else {
    next.add(ruleId);
  }
  favorites.value = Array.from(next);
};

const viewExample = (questionId: string) => {
  router.push({ path: '/explain', query: { questionId } });
};
</script>

<template>
  <section class="panel kouji-board">
    <header>
      <h2>口技学习</h2>
      <p>口诀卡片 + 对应牌例，反复朗读更容易记牢。</p>
    </header>

    <label class="filter-label">
      阶段筛选
      <select v-model="stageFilter">
        <option value="all">全部阶段</option>
        <option v-for="(meta, key) in stageMeta" :key="key" :value="key">{{ meta.name }}</option>
      </select>
    </label>

    <div class="rule-cards">
      <article class="rule-card" v-for="rule in filteredRules" :key="rule.id">
        <RulePill :rule="rule" />
        <p>{{ rule.description }}</p>

        <div class="actions">
          <button type="button" @click="toggleFavorite(rule.id)">
            {{ favoriteSet.has(rule.id) ? '取消收藏' : '收藏口诀' }}
          </button>
        </div>

        <div class="examples" v-if="rule.exampleQuestionIds.length">
          <strong>牌例：</strong>
          <button
            v-for="exampleId in rule.exampleQuestionIds.slice(0, 3)"
            :key="exampleId"
            type="button"
            @click="viewExample(exampleId)"
          >
            看 {{ exampleId }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.kouji-board {
  display: grid;
  gap: 16px;
}

header h2 {
  margin: 0;
  color: #214336;
}

header p {
  margin: 8px 0 0;
  color: #5a7f6b;
}

.filter-label {
  display: grid;
  gap: 6px;
  color: #345948;
  font-weight: 600;
}

select {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(59, 95, 80, 0.3);
  padding: 0 10px;
}

.rule-cards {
  display: grid;
  gap: 10px;
}

.rule-card {
  border-radius: 16px;
  border: 1px solid rgba(54, 89, 74, 0.2);
  background: #fffef9;
  padding: 14px;
  display: grid;
  gap: 10px;
}

.rule-card p {
  margin: 0;
  color: #4f715f;
}

.actions button,
.examples button {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(54, 89, 74, 0.22);
  background: rgba(244, 239, 219, 0.8);
  color: #2a4739;
  padding: 8px 12px;
}

.examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.examples strong {
  color: #335b49;
}
</style>
