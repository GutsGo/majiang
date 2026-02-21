import type { RuleStageId, RuleTag } from '@/types/training';

export const stageMeta: Record<
  RuleStageId,
  {
    name: string;
    emoji: string;
    summary: string;
  }
> = {
  opening: {
    name: '定缺换牌',
    emoji: '🀄',
    summary: '开局定缺与换三张，快速建立方向。'
  },
  midgame: {
    name: '行牌拆搭',
    emoji: '🧩',
    summary: '中局保留高价值搭子，减少废牌。'
  },
  meld: {
    name: '碰杠节奏',
    emoji: '⚡',
    summary: '无吃规则下，碰杠决定节奏。'
  },
  defense: {
    name: '防守猜牌',
    emoji: '🛡️',
    summary: '识别风险，优先安全出牌。'
  },
  listening: {
    name: '听胡收尾',
    emoji: '🏁',
    summary: '尽快入听，多门听优先。'
  }
};

export const ruleTags: RuleTag[] = [
  {
    id: 'opening-01',
    stageId: 'opening',
    title: '换三张，中间扔；定缺少，演戏猛',
    mnemonic: '中张优先换，定缺选最少花色',
    description:
      '换三张优先换4-6中张，定缺选择张数最少花色，必要时保留一张迷惑对手。',
    exampleQuestionIds: []
  },
  {
    id: 'opening-02',
    stageId: 'opening',
    title: '前三巡，清缺门',
    mnemonic: '缺门不清，点炮风险高',
    description: '开局前三巡优先打掉缺门花色，防止被动点炮。',
    exampleQuestionIds: []
  },
  {
    id: 'opening-03',
    stageId: 'opening',
    title: '中间张当炮弹，边张对子留暗箭',
    mnemonic: '中张可换，边张对子可留',
    description: '中张对别人更有连接价值，边张和对子在自己手里更稳定。',
    exampleQuestionIds: []
  },
  {
    id: 'opening-04',
    stageId: 'opening',
    title: '金三银七臭二八',
    mnemonic: '留3/7，早打2/8',
    description: '3、7两侧衔接强；2、8衔接弱，通常先处理2、8。',
    exampleQuestionIds: []
  },
  {
    id: 'midgame-01',
    stageId: 'midgame',
    title: '一四七打一，二五八打五，三六九打九',
    mnemonic: '保中弃边，优先留靠张多的牌',
    description: '按筋线原则保留更容易形成顺子的中间牌。',
    exampleQuestionIds: []
  },
  {
    id: 'midgame-02',
    stageId: 'midgame',
    title: '拆边不拆卡，留中不留边',
    mnemonic: '先拆12/89，后拆35/46',
    description: '边张搭子效率低，卡张和中张更有价值。',
    exampleQuestionIds: []
  },
  {
    id: 'midgame-03',
    stageId: 'midgame',
    title: '搭子少丢边张，搭子多拆边搭',
    mnemonic: '看整体搭子数量再拆',
    description: '根据手牌结构动态处理边张。',
    exampleQuestionIds: []
  },
  {
    id: 'midgame-04',
    stageId: 'midgame',
    title: '对子数量要留意，少对留生多对弃',
    mnemonic: '1-2对先留，3对以上考虑拆',
    description: '对子过多会拖慢成牌速度，需要拆熟对子提速。',
    exampleQuestionIds: []
  },
  {
    id: 'midgame-05',
    stageId: 'midgame',
    title: '连张组合力量大，轻易丢弃不可取',
    mnemonic: '45/56/67优先保留',
    description: '连张提供多面进张，是中盘核心资产。',
    exampleQuestionIds: []
  },
  {
    id: 'midgame-06',
    stageId: 'midgame',
    title: '早打生张，迟打熟张',
    mnemonic: '前期快处理风险牌，后期打熟牌',
    description: '中后盘防守优先级上升，已现牌更安全。',
    exampleQuestionIds: []
  },
  {
    id: 'meld-01',
    stageId: 'meld',
    title: '有碰先碰，打乱牌序',
    mnemonic: '牌差可碰杠搅局，牌顺慎碰',
    description: '碰牌可打断对手摸牌节奏，但会暴露信息。',
    exampleQuestionIds: []
  },
  {
    id: 'meld-02',
    stageId: 'meld',
    title: '牌从门前过，不如摸一个',
    mnemonic: '非必要不急碰',
    description: '保留门清与摸牌弹性，避免过早锁死牌型。',
    exampleQuestionIds: []
  },
  {
    id: 'meld-03',
    stageId: 'meld',
    title: '暗杠是利剑，明杠露信息',
    mnemonic: '暗杠优于明杠',
    description: '暗杠收益隐蔽，明杠虽加番但更暴露。',
    exampleQuestionIds: []
  },
  {
    id: 'meld-04',
    stageId: 'meld',
    title: '想碰不碰，再等一巡',
    mnemonic: '犹豫先过，再看一轮',
    description: '回看一巡桌面信息，再决定碰杠更稳。',
    exampleQuestionIds: []
  },
  {
    id: 'defense-01',
    stageId: 'defense',
    title: '盯上卡下防对家，熟张保平安',
    mnemonic: '先盯危险位，再打熟牌',
    description: '以位置关系与出牌节奏判断风险，优先熟牌。',
    exampleQuestionIds: []
  },
  {
    id: 'defense-02',
    stageId: 'defense',
    title: '下家打一不打三，下家打万我打饼',
    mnemonic: '顺下家牌路，避冲突',
    description: '观察下家花色偏好，避免给其顺手碰杠。',
    exampleQuestionIds: []
  },
  {
    id: 'defense-03',
    stageId: 'defense',
    title: '先四后二必有对一，先六后八必有对九',
    mnemonic: '顺序反推对子',
    description: '根据对手弃牌顺序推断其可能保留对子。',
    exampleQuestionIds: []
  },
  {
    id: 'defense-04',
    stageId: 'defense',
    title: '九不见，必定有人要；一路不见，必有大牌',
    mnemonic: '长期不见即高风险',
    description: '某牌久未出现，通常在他人手里形成关键结构。',
    exampleQuestionIds: []
  },
  {
    id: 'listening-01',
    stageId: 'listening',
    title: '早听早胡莫贪大牌，小胡也是胡',
    mnemonic: '先效率后牌型',
    description: '血战节奏快，先胡收益普遍高于贪大。',
    exampleQuestionIds: []
  },
  {
    id: 'listening-02',
    stageId: 'listening',
    title: '听牌多选多门听，不恋对倒与边张',
    mnemonic: '多门听优先',
    description: '尽量构建3面及以上听口，降低卡手概率。',
    exampleQuestionIds: []
  },
  {
    id: 'listening-03',
    stageId: 'listening',
    title: '对倒不好胡，边张也要出',
    mnemonic: '必要时拆对倒提速',
    description: '对倒胡牌率低，必要时拆成更宽听口。',
    exampleQuestionIds: []
  },
  {
    id: 'listening-04',
    stageId: 'listening',
    title: '牌回头，必要留',
    mnemonic: '回头牌常是安全张或胡张',
    description: '自己打过再摸回的牌，常可作为防守或听口资源。',
    exampleQuestionIds: []
  }
];

export const stageOrder: RuleStageId[] = ['opening', 'midgame', 'meld', 'defense', 'listening'];
