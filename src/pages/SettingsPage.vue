<script setup lang="ts">
import { computed } from 'vue';
import { useTrainingStore } from '@/app/stores/useTrainingStore';

const store = useTrainingStore();

const fontScale = computed({
  get: () => store.settings.fontScale,
  set: (value) => store.updateSettings({ ...store.settings, fontScale: value })
});

const soundEnabled = computed({
  get: () => store.settings.soundEnabled,
  set: (value) => store.updateSettings({ ...store.settings, soundEnabled: value })
});

const handedness = computed({
  get: () => store.settings.handedness,
  set: (value) => store.updateSettings({ ...store.settings, handedness: value })
});
</script>

<template>
  <section class="panel settings-page">
    <header>
      <h2>训练设置</h2>
      <p>设置保存在本地浏览器，可离线使用。</p>
    </header>

    <label>
      字号
      <select v-model="fontScale">
        <option value="sm">小号</option>
        <option value="md">标准</option>
        <option value="lg">大号</option>
      </select>
    </label>

    <label class="inline">
      <input type="checkbox" v-model="soundEnabled" />
      开启答题音效
    </label>

    <label>
      移动端持机方向
      <select v-model="handedness">
        <option value="right">右手优先布局</option>
        <option value="left">左手优先布局</option>
      </select>
    </label>
  </section>
</template>

<style scoped>
.settings-page {
  display: grid;
  gap: 14px;
}

header h2 {
  margin: 0;
  color: #224234;
}

header p {
  margin: 8px 0 0;
  color: #587a69;
}

label {
  display: grid;
  gap: 6px;
  color: #355948;
  font-weight: 600;
}

select,
input[type='checkbox'] {
  min-height: 44px;
}

select {
  border-radius: 10px;
  border: 1px solid rgba(54, 90, 74, 0.3);
  padding: 0 10px;
}

.inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
