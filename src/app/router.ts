import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue')
    },
    {
      path: '/explain',
      name: 'explain',
      component: () => import('@/pages/ExplainPage.vue')
    },
    {
      path: '/challenge',
      name: 'challenge',
      component: () => import('@/pages/ChallengePage.vue')
    },
    {
      path: '/kouji',
      name: 'kouji',
      component: () => import('@/pages/KoujiPage.vue')
    },
    {
      path: '/mistakes',
      name: 'mistakes',
      component: () => import('@/pages/MistakesPage.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/pages/SettingsPage.vue')
    },
    {
      path: '/progress',
      name: 'progress',
      component: () => import('@/pages/ProgressPage.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue')
    }
  ]
});

export default router;
