<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  tile: string;
  back?: boolean;
  compact?: boolean;
}>();

type Suit = '万' | '条' | '筒';

const tileMeta = computed(() => {
  const match = props.tile.match(/^([1-9])(万|条|筒)$/);
  if (!match) {
    return {
      rank: 0,
      suit: null as Suit | null
    };
  }

  return {
    rank: Number(match[1]),
    suit: match[2] as Suit
  };
});

const suitClass = computed(() => {
  if (tileMeta.value.suit === '万') return 'suit-wan';
  if (tileMeta.value.suit === '条') return 'suit-tiao';
  if (tileMeta.value.suit === '筒') return 'suit-tong';
  return 'suit-unknown';
});

const chineseNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

const dotMap: Record<number, number[]> = {
  1: [4],
  2: [0, 8], // 对角排列
  3: [0, 4, 8], // 对角排列
  4: [0, 2, 6, 8], // 四角排列
  5: [0, 2, 4, 6, 8], // 四角 + 中心
  6: [0, 2, 3, 5, 6, 8], // 两列各三
  7: [0, 3, 4, 5, 6, 7, 8], // 六筒排列 + 一个偏置
  8: [0, 1, 2, 3, 5, 6, 7, 8], // 两列各四
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8] // 九宫格全满
};

const tongDots = computed(() => dotMap[tileMeta.value.rank] ?? []);
const tongFiveDots = [0, 2, 4, 6, 8];
const tongNineDots = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const tongEightDots = [0, 1, 2, 3, 4, 5, 6, 7]; // 2x4 grid

const tiaoLayoutMap: Record<number, number[]> = {
  2: [1, 7], // 上下各一
  3: [1, 6, 8], // 上一底二
  4: [0, 2, 6, 8], // 四角
  5: [0, 2, 4, 6, 8], // 四角 + 中心
  6: [0, 2, 3, 5, 6, 8], // 两列各三
  7: [1, 3, 4, 5, 6, 7, 8], // 上一底六
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8] // 九宫格
};

const tiaoBars = computed(() => {
  const rank = tileMeta.value.rank;
  const slots = tiaoLayoutMap[rank] ?? [];
  return slots.map((slot, index) => ({
    slot,
    index
  }));
});

const tiaoEightSlots = [0, 1, 2, 3, 4, 5, 6, 7]; // 2x4 grid
const tiaoEightBars = computed(() =>
  tiaoEightSlots.map((slot, index) => ({
    slot,
    index
  }))
);

const tongDotColor = (index: number, rank: number) => {
  if (rank === 1) return 'dot-red';
  if (rank === 2) return index === 0 ? 'dot-green' : 'dot-blue';
  if (rank === 5 && index === 2) return 'dot-red';
  if (rank === 7 && index === 0) return 'dot-green';
  const cycle = ['dot-blue', 'dot-green', 'dot-red'] as const;
  return cycle[index % cycle.length];
};

const tongSpecialDotClass = (rank: number, index: number) => {
  if (rank === 5) return index === 2 ? 'dot-red' : 'dot-green';
  if (rank === 9) {
    if (index === 4) return 'dot-gold';
    return index % 2 === 0 ? 'dot-red' : 'dot-blue';
  }
  return 'dot-blue';
};

const tiaoBarClass = (rank: number, index: number) => {
  if (rank === 5 && index === 2) return 'bar-red';
  if (rank === 7 && index === 0) return 'bar-red';
  if (rank === 3 && index === 0) return 'bar-red';
  if (rank === 8 && (index === 1 || index === 6)) return 'bar-blue';
  if (index % 3 === 0) return 'bar-green';
  if (index % 3 === 1) return 'bar-blue';
  return 'bar-green';
};

const tongEightDotClass = (index: number) => {
  if (index < 2) return 'dot-red';
  if (index === 4 || index === 5) return 'dot-green';
  return 'dot-blue';
};
</script>

<template>
  <div :class="['mahjong-tile', { back: props.back, compact: props.compact }]"
    :aria-label="props.back ? '牌背' : props.tile">
    <div class="tile-body">
      <div v-if="!props.back" :class="['tile-face', suitClass]">
        <div class="center-art">
          <template v-if="tileMeta.suit === '万'">
            <span class="wan-num">{{ chineseNums[tileMeta.rank] }}</span>
            <span class="wan-char">萬</span>
          </template>

          <template v-else-if="tileMeta.suit === '条'">
            <div v-if="tileMeta.rank === 1" class="tiao-one">
              <div class="bird-head"></div>
              <div class="bird-body"></div>
              <div class="bird-wing"></div>
              <div class="bird-tail"></div>
            </div>

            <div v-else-if="tileMeta.rank === 8" class="tiao-eight-grid">
              <span v-for="bar in tiaoEightBars" :key="`tiao-8-${props.tile}-${bar.slot}-${bar.index}`"
                :class="['tiao-bar', tiaoBarClass(tileMeta.rank, bar.index)]" :style="{
                  gridColumn: `${(bar.slot % 2) + 1}`,
                  gridRow: `${Math.floor(bar.slot / 2) + 1}`
                }" />
            </div>

            <div v-else class="tiao-grid">
              <span v-for="bar in tiaoBars" :key="`tiao-${props.tile}-${bar.slot}-${bar.index}`"
                :class="['tiao-bar', tiaoBarClass(tileMeta.rank, bar.index)]" :style="{
                  gridColumn: `${(bar.slot % 3) + 1}`,
                  gridRow: `${Math.floor(bar.slot / 3) + 1}`
                }" />
            </div>
          </template>

          <template v-else-if="tileMeta.suit === '筒'">
            <div v-if="tileMeta.rank === 1" class="tong-special tong-one">
              <span class="tong-ring ring-outer" />
              <span class="tong-ring ring-mid" />
              <span class="tong-ring ring-inner" />
              <span class="tong-core" />
            </div>

            <div v-else-if="tileMeta.rank === 5" class="tong-grid tong-grid-special">
              <span v-for="(slot, index) in tongFiveDots" :key="`tong-five-${props.tile}-${slot}-${index}`"
                :class="['tong-dot', 'tong-dot-special', tongSpecialDotClass(5, index)]" :style="{
                  gridColumn: `${(slot % 3) + 1}`,
                  gridRow: `${Math.floor(slot / 3) + 1}`
                }" />
            </div>

            <div v-else-if="tileMeta.rank === 9" class="tong-grid tong-grid-special">
              <span v-for="(slot, index) in tongNineDots" :key="`tong-nine-${props.tile}-${slot}-${index}`"
                :class="['tong-dot', 'tong-dot-special', tongSpecialDotClass(9, index)]" :style="{
                  gridColumn: `${(slot % 3) + 1}`,
                  gridRow: `${Math.floor(slot / 3) + 1}`
                }" />
            </div>

            <div v-else-if="tileMeta.rank === 8" class="tong-eight-grid">
              <span v-for="(slot, index) in tongEightDots" :key="`tong-eight-${props.tile}-${slot}-${index}`"
                :class="['tong-dot', 'tong-dot-special', tongEightDotClass(index)]" :style="{
                  gridColumn: `${(slot % 2) + 1}`,
                  gridRow: `${Math.floor(slot / 2) + 1}`
                }" />
            </div>

            <div v-else class="tong-grid">
              <span v-for="(slot, index) in tongDots" :key="`tong-${props.tile}-${slot}-${index}`"
                :class="['tong-dot', tongDotColor(index, tileMeta.rank)]" :style="{
                  gridColumn: `${(slot % 3) + 1}`,
                  gridRow: `${Math.floor(slot / 3) + 1}`
                }" />
            </div>
          </template>

          <span v-else class="tile-label">{{ props.tile }}</span>
        </div>
      </div>
      <div v-else class="tile-back-content">
        <span class="tile-bamboo" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mahjong-tile {
  width: 52px;
  height: 72px;
  display: inline-flex;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
  cursor: pointer;
  --tile-face-margin: 1px;
  --tile-face-pad: 1px;
  --tile-art-scale: 1;
}

.tile-body {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: #2a7e5a;
  /* 默认绿色牌身 */
  padding-bottom: 5px;
  /* 这里形成厚度感 */
  box-shadow:
    0 1px 0 #1b533a,
    0 2px 0 #1b533a,
    0 3px 0 #15422e,
    0 4px 6px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.tile-face {
  flex: 1;
  background: linear-gradient(135deg, #ffffff 0%, #fefcf5 100%);
  border-radius: 4px;
  margin: var(--tile-face-margin);
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    inset 0 -1px 2px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.mahjong-tile.compact {
  width: 44px;
  height: 60px;
}

.mahjong-tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
}

.center-art {
  width: 38px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  transform: scale(var(--tile-art-scale));
  transform-origin: center;
}

/* 万字 */
.suit-wan .wan-num,
.suit-wan .wan-char {
  color: #bf2f29;
  display: block;
  text-align: center;
  font-family: "Xingkai", "STXingkai", "华文行楷", "Xingkai SC", "Kaiti", "楷体", cursive;
}

.wan-num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
}

.wan-char {
  margin-top: -2px;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
}

/* 条子 */
.tiao-grid {
  width: 32px;
  height: 40px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  place-items: center;
}

.tiao-eight-grid {
  width: 28px;
  height: 42px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(4, 1fr);
  place-items: center;
}

.tiao-bar {
  width: 8px;
  height: 14px;
  border-radius: 3px;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.tiao-eight-grid .tiao-bar {
  height: 10px;
}

.bar-green {
  background: linear-gradient(135deg, #4da472, #216d44);
}

.bar-blue {
  background: linear-gradient(135deg, #6ba1e4, #2a5a9c);
}

.bar-red {
  background: linear-gradient(135deg, #e67c74, #b4352a);
}

/* 么鸡 (一条) */
.tiao-one {
  width: 32px;
  height: 42px;
  position: relative;
  background-image: radial-gradient(circle at 50% 50%, rgba(77, 164, 114, 0.1) 20%, transparent 60%);
}

.bird-head {
  position: absolute;
  top: 6px;
  left: 14px;
  width: 6px;
  height: 6px;
  background: #bf2f29;
  border-radius: 50%;
}

.bird-body {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 14px;
  height: 18px;
  background: #2a7e5a;
  border-radius: 40% 40% 50% 50%;
}

.bird-wing {
  position: absolute;
  top: 12px;
  left: 4px;
  width: 26px;
  height: 10px;
  background: #246aa3;
  border-radius: 50% 50% 50% 50%;
  opacity: 0.8;
}

.bird-tail {
  position: absolute;
  bottom: 8px;
  left: 10px;
  width: 14px;
  height: 6px;
  background: #2a7e5a;
  clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
}

/* 筒子 */
.tong-grid {
  width: 34px;
  height: 42px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  place-items: center;
}

.tong-eight-grid {
  width: 30px;
  height: 42px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(4, 1fr);
  place-items: center;
}

.tong-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.tong-dot-special {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.tong-one {
  width: 38px;
  height: 38px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tong-one .tong-ring {
  position: absolute;
  border-radius: 50%;
  border-style: solid;
}

.ring-outer {
  width: 36px;
  height: 36px;
  border-width: 4px;
  border-color: #bf2f29;
}

.ring-mid {
  width: 24px;
  height: 24px;
  border-width: 3px;
  border-color: #246aa3;
}

.ring-inner {
  width: 14px;
  height: 14px;
  border-width: 3px;
  border-color: #2a7e5a;
}

.tong-core {
  width: 4px;
  height: 4px;
  background: #bf2f29;
  border-radius: 50%;
}

/* 颜色 */
.dot-red {
  background: radial-gradient(circle at 30% 30%, #f1938c, #bf2f29);
}

.dot-green {
  background: radial-gradient(circle at 30% 30%, #a2d9b1, #2a7e5a);
}

.dot-blue {
  background: radial-gradient(circle at 30% 30%, #87b9ec, #246aa3);
}

.dot-gold {
  background: radial-gradient(circle at 30% 30%, #f7e39c, #c5902f);
}

/* 牌背 */
.mahjong-tile.back .tile-body {
  padding-bottom: 0;
  background: #2a7e5a;
}

.tile-back-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2a7e5a 0%, #1b533a 100%);
  border-radius: 4px;
  margin: 2px;
}

.tile-bamboo {
  width: 28px;
  height: 36px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M0 0h10v10H0z' fill='none'/%3E%3Cpath d='M5 0v10' stroke='rgba(255,255,255,0.1)' stroke-width='1'/%3E%3C/svg%3E");
  opacity: 0.3;
}

/* 紧凑模式 */
.mahjong-tile.compact .center-art {
  transform: scale(0.85);
}

.mahjong-tile.compact .tile-body {
  padding-bottom: 4px;
}
</style>
