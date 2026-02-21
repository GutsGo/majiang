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
const showOnlyFavorites = ref(false);
const favorites = useStorage<string[]>('panda-majiang-rule-favorites', []);

const filteredRules = computed(() => {
  let rules = store.ruleTagsWithExamples;
  
  if (stageFilter.value !== 'all') {
    rules = rules.filter(r => r.stageId === stageFilter.value);
  }
  
  if (showOnlyFavorites.value) {
    rules = rules.filter(r => favorites.value.includes(r.id));
  }
  
  return rules;
});

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

    <div class="filters">
      <label class="filter-label">
        阶段筛选
        <select v-model="stageFilter">
          <option value="all">全部阶段</option>
          <option v-for="(meta, key) in stageMeta" :key="key" :value="key">{{ meta.name }}</option>
        </select>
      </label>

      <label class="fav-toggle">
        <input type="checkbox" v-model="showOnlyFavorites" />
        <span>仅看收藏 ({{ favorites.length }})</span>
      </label>
    </div>

    <div class="rule-cards">
      <article class="rule-card" v-for="rule in filteredRules" :key="rule.id">
        <RulePill :rule="rule" />
        <p>{{ rule.description }}</p>

        <div class="actions">
          <button 
            type="button" 
            class="fav-btn"
            :class="{ active: favoriteSet.has(rule.id) }"
            @click="toggleFavorite(rule.id)"
          >
            <span class="icon">{{ favoriteSet.has(rule.id) ? '★' : '☆' }}</span>
            {{ favoriteSet.has(rule.id) ? '已收藏' : '收藏口诀' }}
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

.filters {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-label {
  display: grid;
  gap: 6px;
  color: #345948;
  font-weight: 600;
  flex: 1;
  min-width: 200px;
}

.fav-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid rgba(59, 95, 80, 0.2);
  user-select: none;
  font-weight: 600;
  color: #345948;
}

.fav-toggle input {
  width: 18px;
  height: 18px;
  accent-color: #f1c40f;
}

select {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(59, 95, 80, 0.3);
  padding: 0 10px;
  background: white;
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

.fav-btn {
  min-height: 40px;
  border-radius: 99px;
  border: 1px solid rgba(54, 89, 74, 0.2);
  background: white;
  color: #5a7f6b;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.fav-btn .icon {
  font-size: 18px;
  color: #bdc3c7;
  transition: color 0.2s ease;
}

.fav-btn.active {
  background: #fdf9e1;
  border-color: #f1c40f;
  color: #967e00;
}

.fav-btn.active .icon {
  color: #f1c40f;
}

.fav-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.examples button {
  min-height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(54, 89, 74, 0.15);
  background: #f8f9fa;
  color: #2a4739;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.examples button:hover {
  background: #edf7ef;
  border-color: #4d9571;
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
