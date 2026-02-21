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
  2: [1, 7],
  3: [1, 4, 7],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [0, 2, 3, 4, 5, 6, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8]
};

const tongDots = computed(() => dotMap[tileMeta.value.rank] ?? []);
const tongFiveDots = [0, 2, 4, 6, 8];
const tongNineDots = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const tongEightDots = [0, 1, 2, 3, 4, 5, 6, 7];

const tiaoLayoutMap: Record<number, number[]> = {
  2: [1, 7],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [0, 2, 3, 4, 5, 6, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8]
};

const tiaoBars = computed(() => {
  const rank = tileMeta.value.rank;
  const slots = tiaoLayoutMap[rank] ?? [];
  return slots.map((slot, index) => ({
    slot,
    index
  }));
});

const tongDotColor = (index: number, rank: number) => {
  if (rank === 1) return 'dot-red';
  if (rank === 2) return index === 0 ? 'dot-green' : 'dot-blue';
  if (rank === 5 && index === 2) return 'dot-red';
  const cycle = ['dot-red', 'dot-green', 'dot-blue'] as const;
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
  if (rank === 7 && index === 3) return 'bar-red';
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
  <div :class="['mahjong-tile', { back: props.back, compact: props.compact }]" :aria-label="props.back ? '牌背' : props.tile">
    <div v-if="!props.back" :class="['tile-face', suitClass]">
      <span class="corner top">{{ tileMeta.rank || '' }}{{ tileMeta.suit || '' }}</span>
      <div class="center-art">
        <template v-if="tileMeta.suit === '万'">
          <span class="wan-num">{{ chineseNums[tileMeta.rank] }}</span>
          <span class="wan-char">萬</span>
        </template>

        <template v-else-if="tileMeta.suit === '条'">
          <div v-if="tileMeta.rank === 1" class="tiao-one">
            <span class="tiao-stem" />
            <span class="tiao-node node-top" />
            <span class="tiao-node node-mid" />
            <span class="tiao-node node-bottom" />
            <span class="tiao-leaf leaf-left-top" />
            <span class="tiao-leaf leaf-right-top" />
            <span class="tiao-leaf leaf-left-bottom" />
            <span class="tiao-leaf leaf-right-bottom" />
          </div>

          <div v-else class="tiao-grid">
            <span
              v-for="bar in tiaoBars"
              :key="`tiao-${props.tile}-${bar.slot}-${bar.index}`"
              :class="['tiao-bar', tiaoBarClass(tileMeta.rank, bar.index)]"
              :style="{
                gridColumn: `${(bar.slot % 3) + 1}`,
                gridRow: `${Math.floor(bar.slot / 3) + 1}`
              }"
            />
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
            <span
              v-for="(slot, index) in tongFiveDots"
              :key="`tong-five-${props.tile}-${slot}-${index}`"
              :class="['tong-dot', 'tong-dot-special', tongSpecialDotClass(5, index)]"
              :style="{
                gridColumn: `${(slot % 3) + 1}`,
                gridRow: `${Math.floor(slot / 3) + 1}`
              }"
            />
          </div>

          <div v-else-if="tileMeta.rank === 9" class="tong-grid tong-grid-special">
            <span
              v-for="(slot, index) in tongNineDots"
              :key="`tong-nine-${props.tile}-${slot}-${index}`"
              :class="['tong-dot', 'tong-dot-special', tongSpecialDotClass(9, index)]"
              :style="{
                gridColumn: `${(slot % 3) + 1}`,
                gridRow: `${Math.floor(slot / 3) + 1}`
              }"
            />
          </div>

          <div v-else-if="tileMeta.rank === 8" class="tong-eight-grid">
            <span
              v-for="(slot, index) in tongEightDots"
              :key="`tong-eight-${props.tile}-${slot}-${index}`"
              :class="['tong-dot', 'tong-dot-special', tongEightDotClass(index)]"
              :style="{
                gridColumn: `${(slot % 2) + 1}`,
                gridRow: `${Math.floor(slot / 2) + 1}`
              }"
            />
          </div>

          <div v-else class="tong-grid">
            <span
              v-for="(slot, index) in tongDots"
              :key="`tong-${props.tile}-${slot}-${index}`"
              :class="['tong-dot', tongDotColor(index, tileMeta.rank)]"
              :style="{
                gridColumn: `${(slot % 3) + 1}`,
                gridRow: `${Math.floor(slot / 3) + 1}`
              }"
            />
          </div>
        </template>

        <span v-else class="tile-label">{{ props.tile }}</span>
      </div>
      <span class="corner bottom">{{ tileMeta.rank || '' }}{{ tileMeta.suit || '' }}</span>
    </div>

    <span v-else class="tile-bamboo" />
  </div>
</template>

<style scoped>
.mahjong-tile {
  width: 54px;
  height: 74px;
  border-radius: 12px;
  border: 1px solid rgba(95, 77, 48, 0.32);
  background: linear-gradient(150deg, #fffefb, #f3ebd8 70%, #ebdfc3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset -1px -1px 0 rgba(167, 136, 84, 0.25),
    0 6px 12px rgba(28, 47, 39, 0.16);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.mahjong-tile::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  right: 3px;
  bottom: 3px;
  border-radius: 10px;
  border: 1px solid rgba(126, 102, 67, 0.18);
  pointer-events: none;
}

.mahjong-tile.compact {
  width: 46px;
  height: 64px;
}

.mahjong-tile.compact .tile-face {
  padding: 6px 5px;
}

.mahjong-tile.compact .center-art {
  width: 28px;
  height: 32px;
}

.mahjong-tile.compact .wan-num {
  font-size: 15px;
}

.mahjong-tile.compact .wan-char {
  font-size: 11px;
}

.mahjong-tile.compact .tong-dot {
  width: 7px;
  height: 7px;
}

.mahjong-tile.compact .tong-dot-special {
  width: 8px;
  height: 8px;
}

.mahjong-tile.compact .tong-special {
  width: 28px;
  height: 32px;
}

.mahjong-tile.compact .tong-eight-grid {
  width: 24px;
  height: 31px;
}

.mahjong-tile.compact .tiao-one {
  width: 24px;
  height: 30px;
}

.mahjong-tile.compact .tiao-bar {
  width: 6px;
  height: 10px;
}

.mahjong-tile.compact .tong-one .ring-outer {
  width: 25px;
  height: 25px;
  border-width: 3px;
}

.mahjong-tile.compact .tong-one .ring-mid {
  width: 18px;
  height: 18px;
  border-width: 2px;
}

.mahjong-tile.compact .tong-one .ring-inner {
  width: 11px;
  height: 11px;
  border-width: 2px;
}

.mahjong-tile.compact .tong-one .tong-core {
  width: 3px;
  height: 3px;
}

.mahjong-tile.compact .tiao-stem {
  width: 6px;
  height: 26px;
}

.mahjong-tile.compact .tiao-node {
  width: 10px;
  height: 3px;
}

.mahjong-tile.compact .node-top {
  top: 7px;
}

.mahjong-tile.compact .node-mid {
  top: 13px;
}

.mahjong-tile.compact .node-bottom {
  top: 19px;
}

.mahjong-tile.compact .tiao-leaf {
  width: 7px;
  height: 4px;
}

.mahjong-tile.compact .leaf-left-top,
.mahjong-tile.compact .leaf-left-bottom {
  left: 2px;
}

.mahjong-tile.compact .leaf-right-top,
.mahjong-tile.compact .leaf-right-bottom {
  right: 2px;
}

.mahjong-tile.compact .leaf-left-top,
.mahjong-tile.compact .leaf-right-top {
  top: 9px;
}

.mahjong-tile.compact .leaf-left-bottom,
.mahjong-tile.compact .leaf-right-bottom {
  top: 17px;
}

.mahjong-tile:hover {
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset -1px -1px 0 rgba(167, 136, 84, 0.25),
    0 10px 14px rgba(28, 47, 39, 0.2);
}

.tile-face {
  width: 100%;
  height: 100%;
  padding: 7px 6px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border-radius: 10px;
}

.corner {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.corner.bottom {
  justify-self: end;
  transform: rotate(180deg);
}

.center-art {
  place-self: center;
  width: 34px;
  height: 40px;
  display: grid;
  place-items: center;
}

.suit-wan .corner,
.suit-wan .wan-num,
.suit-wan .wan-char {
  color: #bf2f29;
}

.wan-num {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.wan-char {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.suit-tiao .corner {
  color: #1f7049;
}

.tiao-grid {
  width: 30px;
  height: 36px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  place-items: center;
}

.tiao-bar {
  width: 7px;
  height: 12px;
  border-radius: 4px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    inset 0 -1px 0 rgba(16, 78, 46, 0.5);
}

.bar-green {
  background: linear-gradient(180deg, #5bb380, #277d4f);
}

.bar-blue {
  background: linear-gradient(180deg, #87b9ec, #3f6fb0);
}

.bar-red {
  background: linear-gradient(180deg, #f1938c, #c44a3e);
}

.tiao-one {
  width: 28px;
  height: 34px;
  position: relative;
}

.tiao-stem {
  position: absolute;
  left: 50%;
  top: 2px;
  width: 7px;
  height: 30px;
  transform: translateX(-50%);
  border-radius: 4px;
  background: linear-gradient(180deg, #68b98b, #2e8458);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -1px 0 rgba(16, 78, 46, 0.45);
}

.tiao-node {
  position: absolute;
  left: 50%;
  width: 12px;
  height: 4px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #2d7c52;
}

.node-top {
  top: 8px;
}

.node-mid {
  top: 16px;
}

.node-bottom {
  top: 24px;
}

.tiao-leaf {
  position: absolute;
  width: 9px;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(180deg, #88c7f1, #4a7eb9);
}

.leaf-left-top {
  left: 3px;
  top: 10px;
}

.leaf-right-top {
  right: 3px;
  top: 10px;
}

.leaf-left-bottom {
  left: 3px;
  top: 20px;
}

.leaf-right-bottom {
  right: 3px;
  top: 20px;
}

.suit-tong .corner {
  color: #246aa3;
}

.tong-grid {
  width: 30px;
  height: 36px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  place-items: center;
}

.tong-eight-grid {
  width: 28px;
  height: 36px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(4, 1fr);
  place-items: center;
}

.tong-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5);
}

.tong-dot-special {
  width: 9px;
  height: 9px;
  border: 1px solid rgba(18, 47, 83, 0.18);
}

.tong-special {
  width: 32px;
  height: 36px;
  position: relative;
  display: grid;
  place-items: center;
}

.tong-one .tong-ring {
  position: absolute;
  border-radius: 50%;
}

.tong-one .ring-outer {
  width: 30px;
  height: 30px;
  border: 4px solid #c9463d;
  background: transparent;
  box-shadow: none;
}

.tong-one .ring-mid {
  width: 21px;
  height: 21px;
  border: 3px solid #3978be;
  background: transparent;
}

.tong-one .ring-inner {
  width: 13px;
  height: 13px;
  border: 3px solid #3a9865;
  background: transparent;
}

.tong-one .tong-core {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #2d3d36;
  box-shadow: none;
}

.dot-red {
  background: radial-gradient(circle at 35% 35%, #ffd8d4, #cb4a3f 70%);
}

.dot-green {
  background: radial-gradient(circle at 35% 35%, #d7f4e2, #3f9665 70%);
}

.dot-blue {
  background: radial-gradient(circle at 35% 35%, #d8ecff, #4b78be 70%);
}

.dot-gold {
  background: radial-gradient(circle at 35% 35%, #fff2c8, #c5902f 72%);
}

.tile-label {
  font-weight: 700;
  color: #2f4d3d;
}

.mahjong-tile.back {
  background:
    linear-gradient(160deg, rgba(116, 172, 148, 0.24), rgba(66, 116, 94, 0.2)),
    url('../assets/panda/bamboo-pattern.svg');
  background-size: cover;
  border-color: rgba(42, 89, 68, 0.35);
}

.tile-bamboo {
  width: 24px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(44, 126, 90, 0.65), rgba(26, 94, 64, 0.9));
  box-shadow:
    inset 0 2px 1px rgba(255, 255, 255, 0.4),
    inset 0 -2px 1px rgba(0, 0, 0, 0.16);
  position: relative;
}

.tile-bamboo::before,
.tile-bamboo::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.7);
}

.tile-bamboo::before {
  top: 10px;
}

.tile-bamboo::after {
  top: 20px;
}
</style>
