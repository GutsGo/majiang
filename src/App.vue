<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useTrainingStore } from '@/app/stores/useTrainingStore';

const store = useTrainingStore();
const appLogo = '/logo.webp';

const appClass = computed(() => [`font-${store.settings.fontScale}`, `hand-${store.settings.handedness}`]);
</script>

<template>
  <div :class="['app-shell', ...appClass]">
    <header class="topbar">
      <RouterLink to="/" class="brand">
        <img :src="appLogo" alt="站点 Logo" />
        <div>
          <strong>糊个铲铲</strong>
          <small>三缺一 · 血战到底训练</small>
        </div>
      </RouterLink>
      <nav>
        <RouterLink to="/settings">设置</RouterLink>
      </nav>
    </header>

    <main class="layout">
      <RouterView />
    </main>
  </div>
</template>
