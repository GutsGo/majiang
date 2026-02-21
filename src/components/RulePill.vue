<script setup lang="ts">
import { computed } from 'vue';
import { stageMeta } from '@/data/rules';
import type { RuleTag } from '@/types/training';

const props = defineProps<{
  rule: RuleTag;
}>();

const stage = computed(() => stageMeta[props.rule.stageId]);
</script>

<template>
  <div class="rule-pill">
    <span class="stage">{{ stage.emoji }} {{ stage.name }}</span>
    <strong>{{ props.rule.title }}</strong>
    <small>{{ props.rule.mnemonic }}</small>
  </div>
</template>

<style scoped>
.rule-pill {
  display: grid;
  gap: 6px;
  border-radius: 14px;
  background: rgba(250, 245, 231, 0.9);
  border: 1px solid rgba(52, 88, 73, 0.18);
  padding: 12px;
}

.stage {
  color: #456b58;
  font-size: 12px;
}

strong {
  color: #234235;
  font-size: 14px;
}

small {
  color: #567a68;
}
</style>
