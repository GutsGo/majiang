<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="title">糊个铲铲</h1>
      <p class="subtitle">三缺一 · 血战到底训练系统</p>
    </div>

    <nav class="game-menu">
      <RouterLink class="menu-item cta-explain" to="/explain">
        <div class="item-inner">
          <div class="item-icon">📖</div>
          <div class="item-text">
            <strong>讲解模式</strong>
            <small>EXPLAIN MODE</small>
          </div>
          <div class="hover-glare"></div>
        </div>
      </RouterLink>

      <RouterLink class="menu-item cta-challenge" to="/challenge">
        <div class="item-inner">
          <div class="item-icon">🀄</div>
          <div class="item-text">
            <strong>闯关模式</strong>
            <small>CHALLENGE MODE</small>
          </div>
          <div class="hover-glare"></div>
        </div>
      </RouterLink>

      <RouterLink class="menu-item cta-kouji" to="/kouji">
        <div class="item-inner">
          <div class="item-icon">🎙️</div>
          <div class="item-text">
            <strong>口技学习</strong>
            <small>MNEMONIC STUDY</small>
          </div>
          <div class="hover-glare"></div>
        </div>
      </RouterLink>

      <RouterLink class="menu-item cta-mistakes" to="/mistakes">
        <div class="item-inner">
          <div class="item-icon">📝</div>
          <div class="item-text">
            <strong>错题复习</strong>
            <small>REVIEW MISTAKES</small>
          </div>
          <div class="hover-glare"></div>
        </div>
      </RouterLink>

      <RouterLink class="menu-item cta-progress" to="/progress">
        <div class="item-inner">
          <div class="item-icon">📈</div>
          <div class="item-text">
            <strong>训练进度</strong>
            <small>TRAINING PROGRESS</small>
          </div>
          <div class="hover-glare"></div>
        </div>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
  padding: 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 48px;
  animation: fadeInDown 0.8s ease-out;
}

.title {
  font-size: clamp(40px, 8vw, 64px);
  font-weight: 800;
  color: #1f4134;
  margin: 0;
  text-shadow: 0 4px 12px rgba(31, 65, 52, 0.15);
  letter-spacing: 2px;
}

.subtitle {
  font-size: 18px;
  color: #597d6b;
  margin-top: 8px;
  font-weight: 500;
}

.game-menu {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 1000px;
  perspective: 1000px;
}

.menu-item {
  text-decoration: none;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.item-inner {
  position: relative;
  height: 120px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 20px;
  background: white;
  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.05),
    inset 0 -4px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.item-icon {
  font-size: 44px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.item-text {
  display: flex;
  flex-direction: column;
}

.item-text strong {
  font-size: 22px;
  color: #2c3e50;
  margin-bottom: 4px;
}

.item-text small {
  font-size: 12px;
  color: #95a5a6;
  letter-spacing: 1px;
}

/* Color Variants */
.cta-explain .item-inner {
  background: linear-gradient(135deg, #fff, #e3f2fd);
  border-color: #bbdefb;
}

.cta-challenge .item-inner {
  background: linear-gradient(135deg, #fff, #e8f5e9);
  border-color: #c8e6c9;
}

.cta-kouji .item-inner {
  background: linear-gradient(135deg, #fff, #f3e5f5);
  border-color: #e1bee7;
}

.cta-mistakes .item-inner {
  background: linear-gradient(135deg, #fff, #fff3e0);
  border-color: #ffe0b2;
}

.cta-progress .item-inner {
  background: linear-gradient(135deg, #fff, #f1f8e9);
  border-color: #dcedc8;
}

/* Hover Effects */
.menu-item:hover {
  transform: translateY(-8px) scale(1.02) rotateX(5deg);
}

.menu-item:hover .item-inner {
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    inset 0 -2px 0 rgba(0, 0, 0, 0.05);
}

.menu-item:hover .item-icon {
  transform: scale(1.2) rotate(10deg);
}

.cta-explain:hover .item-inner {
  border-color: #1976d2;
}

.cta-challenge:hover .item-inner {
  border-color: #2e7d32;
}

.cta-kouji:hover .item-inner {
  border-color: #7b1fa2;
}

.cta-mistakes:hover .item-inner {
  border-color: #e65100;
}

.cta-progress:hover .item-inner {
  border-color: #558b2f;
}

/* Glare Animation */
.hover-glare {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transition: all 0.6s ease;
  transform: skewX(-25deg);
}

.menu-item:hover .hover-glare {
  left: 150%;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .game-menu {
    grid-template-columns: 1fr;
  }

  .item-inner {
    height: 100px;
  }
}
</style>
