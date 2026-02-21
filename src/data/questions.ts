import { ruleTags, stageMeta } from '@/data/rules';
import type {
  ChallengeStage,
  ExplanationStep,
  QuestionOption,
  QuestionType,
  RuleStageId,
  RuleTag,
  TrainingQuestion
} from '@/types/training';

type QuestionTemplate = {
  type: QuestionType;
  multiSelect?: boolean;
  prompt: (variant: number) => string;
  hand: (variant: number) => string[];
  discards?: (variant: number) => string[];
  options: (variant: number) => QuestionOption[];
  correctOptionIds: (variant: number) => string[];
  ruleRefs: string[];
  pitfalls: (variant: number) => string[];
};

const suitCycle = ['万', '条', '筒'] as const;

const ruleMap = new Map(ruleTags.map((tag) => [tag.id, tag]));

const rotateTileSuit = (tile: string, offset: number) => {
  const suit = tile.slice(-1);
  const num = tile.slice(0, -1);
  const index = suitCycle.indexOf(suit as (typeof suitCycle)[number]);
  if (index === -1) return tile;
  const newSuit = suitCycle[(index + offset) % suitCycle.length];
  return `${num}${newSuit}`;
};

const rotateHand = (hand: string[], variant: number) => hand.map((tile) => rotateTileSuit(tile, variant % 3));

const rotateSuitInText = (text: string, variant: number) => {
  return text.replace(/[万条筒]/g, (suit) => rotateTileSuit(suit, variant % 3));
};

const difficultyByIndex = (index: number): 1 | 2 | 3 => {
  const mod = index % 3;
  if (mod === 0) return 1;
  if (mod === 1) return 2;
  return 3;
};

const createExplanationSteps = (
  questionId: string,
  ruleRefs: string[],
  options: QuestionOption[],
  correctOptionIds: string[],
  variant: number
): ExplanationStep[] => {
  const firstRule = ruleMap.get(ruleRefs[0]);
  const secondRule = ruleRefs[1] ? ruleMap.get(ruleRefs[1]) : undefined;
  const answers = options
    .filter((option) => correctOptionIds.includes(option.id))
    .map((option) => option.label)
    .join('、');

  return [
    {
      id: `${questionId}-step-1`,
      title: '先看结构',
      detail: rotateSuitInText('先判断当前手牌是提速局还是防守局，再决定保留中张、拆边张或转守。', variant)
    },
    {
      id: `${questionId}-step-2`,
      title: '套用口诀',
      detail: firstRule
        ? rotateSuitInText(`${firstRule.title}。${firstRule.mnemonic}${secondRule ? `；并结合${secondRule.mnemonic}` : ''}`, variant)
        : '优先遵循阶段口诀，避免凭感觉打牌。'
    },
    {
      id: `${questionId}-step-3`,
      title: '落地决策',
      detail: `本题最佳选择是：${answers || '暂无'}。先做高效率或低风险决策，再考虑番型上限。`
    }
  ];
};

const openingTemplates: QuestionTemplate[] = [
  {
    type: 'dingque_or_huansan',
    prompt: (variant) => rotateSuitInText('换三张后，你手里筒子最少且多为边张，最优定缺应选哪门？', variant),
    hand: (variant) =>
      rotateHand(['1万', '3万', '4万', '7万', '8万', '2条', '3条', '6条', '7条', '2筒', '5筒', '8筒', '9筒'], variant),
    options: (variant) => [
      { id: 'A', label: `缺${rotateTileSuit('万', variant)}`, note: `${rotateTileSuit('万', variant)}子张数偏多且有中张潜力。` },
      { id: 'B', label: `缺${rotateTileSuit('条', variant)}`, note: `${rotateTileSuit('条', variant)}子结构可联动，不宜先弃。` },
      { id: 'C', label: `缺${rotateTileSuit('筒', variant)}`, note: `${rotateTileSuit('筒', variant)}子最少且效率偏低。` },
      { id: 'D', label: '不定缺，先看两巡', note: '血战开局应尽快定方向。' }
    ],
    correctOptionIds: () => ['C'],
    ruleRefs: ['opening-01', 'opening-02'],
    pitfalls: (variant) => [rotateSuitInText('为了“看起来顺”而定缺多张花色，导致中后盘清缺困难。', variant)]
  },
  {
    type: 'dingque_or_huansan',
    prompt: () => '换三张时，下列哪组更适合优先换出？',
    hand: (variant) =>
      rotateHand(['2万', '4万', '5万', '6万', '7万', '2条', '3条', '5条', '7条', '1筒', '1筒', '9筒', '9筒'], variant),
    options: (variant) => [
      { id: 'A', label: rotateSuitInText('4万5万6万', variant), note: '中张给出去会打乱对手顺子效率。' },
      { id: 'B', label: rotateSuitInText('1筒1筒9筒', variant), note: '对子和边张更适合自己留。' },
      { id: 'C', label: rotateSuitInText('2条3条5条', variant), note: `${rotateTileSuit('条', variant)}子有搭子价值。` },
      { id: 'D', label: rotateSuitInText('7万2条9筒', variant), note: '无结构随机换通常收益低。' }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['opening-01', 'opening-03'],
    pitfalls: (variant) => [rotateSuitInText('把对子和边张一起换走，导致后续防守和凑对能力变差。', variant)]
  },
  {
    type: 'discard_best',
    prompt: (variant) => `你已定缺${rotateTileSuit('1筒', variant).slice(-1)}，前三巡该优先打哪张？`,
    hand: (variant) =>
      rotateHand(['2万', '3万', '4万', '6万', '7万', '2条', '3条', '4条', '7条', '8条', '1筒', '6筒', '9筒'], variant),
    options: (variant) => {
      const hand = rotateHand(['2万', '3万', '4万', '6万', '7万', '2条', '3条', '4条', '7条', '8条', '1筒', '6筒', '9筒'], variant);
      const lackTiles = hand.filter((tile) => tile.endsWith(rotateTileSuit('筒', variant)));
      return [
        { id: 'A', label: lackTiles[0] ?? hand[10] },
        { id: 'B', label: hand[0] },
        { id: 'C', label: hand[5] },
        { id: 'D', label: hand[3] }
      ];
    },
    correctOptionIds: () => ['A'],
    ruleRefs: ['opening-02'],
    pitfalls: (variant) => [rotateSuitInText('清缺速度慢会被迫在危险巡目打生张。', variant)]
  },
  {
    type: 'discard_best',
    prompt: () => '根据“金三银七臭二八”，此时优先处理哪张？',
    hand: (variant) => rotateHand(['2万', '3万', '4万', '7万', '7万', '8万', '2条', '3条', '7条', '8条', '2筒', '3筒', '7筒'], variant),
    options: (variant) => [
      { id: 'A', label: rotateTileSuit('3万', variant) },
      { id: 'B', label: rotateTileSuit('7条', variant) },
      { id: 'C', label: rotateTileSuit('2万', variant) },
      { id: 'D', label: rotateTileSuit('7筒', variant) }
    ],
    correctOptionIds: () => ['C'],
    ruleRefs: ['opening-04'],
    pitfalls: (variant) => [rotateSuitInText('误把2当中张保留，导致进张效率偏低。', variant)]
  }
];

const midgameTemplates: QuestionTemplate[] = [
  {
    type: 'discard_best',
    prompt: () => '按照“一四七打一”，这手牌应优先舍哪张？',
    hand: (variant) => rotateHand(['1万', '4万', '7万', '3万', '4万', '5万', '2条', '3条', '4条', '6条', '7条', '8条', '5筒'], variant),
    options: (variant) => [
      { id: 'A', label: rotateTileSuit('1万', variant) },
      { id: 'B', label: rotateTileSuit('4万', variant) },
      { id: 'C', label: rotateTileSuit('7万', variant) },
      { id: 'D', label: rotateTileSuit('5筒', variant) }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['midgame-01'],
    pitfalls: (variant) => [rotateSuitInText('拆掉中张会减少后续两面听机会。', variant)]
  },
  {
    type: 'discard_best',
    prompt: () => '你同时有12边搭与46卡张，拆哪组更优？',
    hand: (variant) => rotateHand(['1万', '2万', '4万', '6万', '3万', '4万', '5万', '6条', '7条', '8条', '2筒', '3筒', '4筒'], variant),
    options: (variant) => [
      { id: 'A', label: rotateSuitInText('拆12边搭', variant) },
      { id: 'B', label: rotateSuitInText('拆46卡张', variant) },
      { id: 'C', label: rotateSuitInText('拆678顺子', variant) },
      { id: 'D', label: rotateSuitInText('拆234顺子', variant) }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['midgame-03', 'midgame-02'],
    pitfalls: (variant) => [rotateSuitInText('误拆卡张会让听口从多面退化为单吊。', variant)]
  },
  {
    type: 'wait_tiles',
    multiSelect: true,
    prompt: (variant) => rotateSuitInText('此手牌已到一向听，若弃9万，哪些进张最多？', variant),
    hand: (variant) => rotateHand(['1万', '2万', '3万', '4万', '5万', '6万', '7万', '8万', '9万', '4条', '5条', '5条', '6条'], variant),
    options: (variant) => [
      { id: 'A', label: rotateSuitInText('2万 / 5万', variant) },
      { id: 'B', label: rotateSuitInText('3万 / 6万', variant) },
      { id: 'C', label: rotateSuitInText('4万 / 7万', variant) },
      { id: 'D', label: rotateSuitInText('仅9万', variant) }
    ],
    correctOptionIds: () => ['B'],
    ruleRefs: ['midgame-05', 'midgame-01'],
    pitfalls: (variant) => [rotateSuitInText('只盯单张听口，没有评估连张整体进张面。', variant)]
  },
  {
    type: 'discard_best',
    prompt: () => '手里已有3个对子，当前最该拆的是？',
    hand: (variant) => rotateHand(['2万', '2万', '5万', '5万', '8万', '8万', '3条', '4条', '5条', '6条', '7条', '3筒', '4筒'], variant),
    options: (variant) => [
      { id: 'A', label: `拆${rotateTileSuit('2万', variant)}对子` },
      { id: 'B', label: `拆${rotateTileSuit('5万', variant)}对子` },
      { id: 'C', label: `拆${rotateTileSuit('8万', variant)}对子` },
      { id: 'D', label: '不拆对子' }
    ],
    correctOptionIds: () => ['C'],
    ruleRefs: ['midgame-04', 'midgame-05'],
    pitfalls: (variant) => [rotateSuitInText('对子过多却不拆，容易错过入听窗口。', variant)]
  },
  {
    type: 'safe_discard',
    prompt: () => '进入后盘，以下哪张更适合优先打出？',
    hand: (variant) => rotateHand(['2万', '3万', '4万', '6万', '7万', '8万', '3条', '4条', '5条', '6筒', '7筒', '8筒', '9条'], variant),
    discards: (variant) => rotateHand(['9条', '9条', '6筒', '1万', '4筒', '6筒'], variant),
    options: (variant) => rotateHand(['9条', '2万', '7万', '8筒'], variant).map((tile, index) => ({ id: String.fromCharCode(65 + index), label: tile })),
    correctOptionIds: () => ['A'],
    ruleRefs: ['midgame-06'],
    pitfalls: (variant) => [rotateSuitInText('后盘还在打生张，容易给听牌家放炮。', variant)]
  }
];

const meldTemplates: QuestionTemplate[] = [
  {
    type: 'peng_or_pass',
    prompt: () => '你手牌较差，上家打出可碰牌，此时更优策略是？',
    hand: (variant) => rotateHand(['1万', '3万', '5万', '7万', '7万', '2条', '4条', '6条', '8条', '3筒', '5筒', '7筒', '9筒'], variant),
    options: () => [
      { id: 'A', label: '碰，主动搅节奏' },
      { id: 'B', label: '不碰，继续门清' },
      { id: 'C', label: '立刻明杠' },
      { id: 'D', label: '弃和防守' }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['meld-01'],
    pitfalls: (variant) => [rotateSuitInText('牌差还一味贪门清，错过改变节奏机会。', variant)]
  },
  {
    type: 'peng_or_pass',
    prompt: () => '牌型尚可且进张多，面对可碰机会应如何？',
    hand: (variant) => rotateHand(['2万', '3万', '4万', '4万', '5万', '6万', '2条', '3条', '4条', '7筒', '8筒', '9筒', '5条'], variant),
    options: () => [
      { id: 'A', label: '立即碰，先定型' },
      { id: 'B', label: '先过，摸一张再看' },
      { id: 'C', label: '直接打中张' },
      { id: 'D', label: '碰后拆顺子' }
    ],
    correctOptionIds: () => ['B'],
    ruleRefs: ['meld-02', 'meld-04'],
    pitfalls: (variant) => [rotateSuitInText('过早碰牌会降低可调整空间。', variant)]
  },
  {
    type: 'peng_or_pass',
    prompt: () => '你有暗刻可杠，且场上两家明显听牌，优先操作是？',
    hand: (variant) => rotateHand(['6万', '6万', '6万', '2条', '3条', '4条', '5条', '6条', '7条', '3筒', '4筒', '5筒', '8筒'], variant),
    options: () => [
      { id: 'A', label: '暗杠，隐藏信息并加速摸牌' },
      { id: 'B', label: '明杠，立刻提番' },
      { id: 'C', label: '拆暗刻不杠' },
      { id: 'D', label: '直接弃和' }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['meld-03'],
    pitfalls: (variant) => [rotateSuitInText('为了提番选择明杠，导致手牌意图暴露。', variant)]
  },
  {
    type: 'peng_or_pass',
    prompt: () => '你对碰牌有犹豫，当前最稳的节奏控制是？',
    hand: (variant) => rotateHand(['1万', '1万', '2万', '3万', '5万', '6万', '7万', '3条', '4条', '6条', '7条', '8筒', '9筒'], variant),
    options: () => [
      { id: 'A', label: '直接碰，避免错过' },
      { id: 'B', label: '先过一巡再决定' },
      { id: 'C', label: '明杠再说' },
      { id: 'D', label: '马上打对子' }
    ],
    correctOptionIds: () => ['B'],
    ruleRefs: ['meld-04', 'meld-02'],
    pitfalls: (variant) => [rotateSuitInText('犹豫时强行碰牌，可能把好型碰坏。', variant)]
  }
];

const defenseTemplates: QuestionTemplate[] = [
  {
    type: 'safe_discard',
    prompt: () => '对家连打中张后停顿，此时哪张相对更安全？',
    hand: (variant) => rotateHand(['1万', '2万', '3万', '4万', '5万', '6万', '2条', '3条', '4条', '7筒', '8筒', '9筒', '9万'], variant),
    discards: (variant) => rotateHand(['4万', '5万', '6万', '2条', '2条', '7筒'], variant),
    options: (variant) => rotateHand(['4万', '9万', '3条', '8筒'], variant).map((tile, index) => ({ id: String.fromCharCode(65 + index), label: tile })),
    correctOptionIds: () => ['A'],
    ruleRefs: ['defense-01'],
    pitfalls: (variant) => [rotateSuitInText('忽略熟牌价值，用生张冒险。', variant)]
  },
  {
    type: 'safe_discard',
    prompt: () => '下家持续打万字，你当前更适合跟哪门？',
    hand: (variant) => rotateHand(['2万', '3万', '7万', '8万', '3条', '4条', '5条', '6条', '2筒', '3筒', '4筒', '7筒', '9筒'], variant),
    discards: (variant) => rotateHand(['1万', '4万', '7万', '2万', '8万'], variant),
    options: (variant) => [
      { id: 'A', label: `继续打${rotateTileSuit('万', variant)}，顺其牌路` },
      { id: 'B', label: `专打${rotateTileSuit('条', variant)}，逼其换门` },
      { id: 'C', label: `专打${rotateTileSuit('筒', variant)}，抢先送张` },
      { id: 'D', label: '打中张试探' }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['defense-02'],
    pitfalls: (variant) => [rotateSuitInText('逆着下家牌路打，提升被碰风险。', variant)]
  },
  {
    type: 'safe_discard',
    prompt: () => '对手先打4再打2，结合口诀最应警惕哪张对子？',
    hand: (variant) => rotateHand(['1万', '4万', '6万', '8万', '2条', '3条', '5条', '7条', '2筒', '4筒', '6筒', '8筒', '9筒'], variant),
    discards: (variant) => rotateHand(['4万', '2万', '7条', '9筒'], variant),
    options: () => [
      { id: 'A', label: '对1' },
      { id: 'B', label: '对5' },
      { id: 'C', label: '对7' },
      { id: 'D', label: '对9' }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['defense-03'],
    pitfalls: (variant) => [rotateSuitInText('不看对手出牌顺序，丢失关键推理信息。', variant)]
  },
  {
    type: 'safe_discard',
    prompt: () => '某一路9长期不见，当前更合理的处理是？',
    hand: (variant) => rotateHand(['2万', '3万', '4万', '6万', '7万', '8万', '2条', '3条', '4条', '5筒', '6筒', '7筒', '9万'], variant),
    discards: (variant) => rotateHand(['1万', '2万', '3万', '4条', '5条', '6条'], variant),
    options: () => [
      { id: 'A', label: '避打这路9，先走熟张' },
      { id: 'B', label: '马上打9试探' },
      { id: 'C', label: '连打两张生牌' },
      { id: 'D', label: '无视信息，按手感出牌' }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['defense-04', 'defense-01'],
    pitfalls: (variant) => [rotateSuitInText('忽略“不见牌”信号，直接送危险张。', variant)]
  }
];

const listeningTemplates: QuestionTemplate[] = [
  {
    type: 'discard_best',
    prompt: () => '你可走清一色慢听，也可两面快听，首选应是？',
    hand: (variant) => rotateHand(['2万', '3万', '4万', '5万', '6万', '7万', '2条', '3条', '4条', '7筒', '8筒', '8筒', '9筒'], variant),
    options: () => [
      { id: 'A', label: '贪清一色，先留杂张' },
      { id: 'B', label: '转两面快听，争取早胡' },
      { id: 'C', label: '改七对路线' },
      { id: 'D', label: '继续观望两巡' }
    ],
    correctOptionIds: () => ['B'],
    ruleRefs: ['listening-01'],
    pitfalls: (variant) => [rotateSuitInText('中后盘仍贪大牌，错过先胡时机。', variant)]
  },
  {
    type: 'wait_tiles',
    multiSelect: true,
    prompt: () => '当前可形成两种听口，哪种更符合“多门听优先”？',
    hand: (variant) => rotateHand(['1万', '2万', '3万', '4万', '5万', '6万', '4条', '5条', '6条', '7条', '8条', '9筒', '9筒'], variant),
    options: (variant) => [
      { id: 'A', label: rotateSuitInText('听3条/6条/9条', variant) },
      { id: 'B', label: `对倒听${rotateTileSuit('7筒', variant)}` },
      { id: 'C', label: `边张听${rotateTileSuit('1万', variant)}` },
      { id: 'D', label: `单吊听${rotateTileSuit('5条', variant)}` }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['listening-02'],
    pitfalls: (variant) => [rotateSuitInText('只看当前番型，不比较听口宽度。', variant)]
  },
  {
    type: 'discard_best',
    prompt: () => '你目前是对倒听，哪种处理更优？',
    hand: (variant) => rotateHand(['1万', '2万', '3万', '4万', '5万', '6万', '7条', '7条', '9条', '9条', '3筒', '4筒', '5筒'], variant),
    options: () => [
      { id: 'A', label: '坚持对倒不动' },
      { id: 'B', label: '拆对转边张听' },
      { id: 'C', label: '弃和防守' },
      { id: 'D', label: '碰后再听' }
    ],
    correctOptionIds: () => ['B'],
    ruleRefs: ['listening-03', 'listening-02'],
    pitfalls: (variant) => [rotateSuitInText('对倒听口过窄，胡牌速度明显变慢。', variant)]
  },
  {
    type: 'safe_discard',
    prompt: () => '你打过的6条又摸回，当前阶段更适合？',
    hand: (variant) => rotateHand(['1万', '2万', '3万', '4万', '5万', '6万', '6条', '7条', '8条', '3筒', '4筒', '5筒', '9筒'], variant),
    discards: (variant) => rotateHand(['6条', '2筒', '5条', '8万', '6条'], variant),
    options: () => [
      { id: 'A', label: '优先保留回头牌，兼顾安全与听口' },
      { id: 'B', label: '马上再打回去' },
      { id: 'C', label: '拆顺保对子' },
      { id: 'D', label: '直接改做大牌' }
    ],
    correctOptionIds: () => ['A'],
    ruleRefs: ['listening-04', 'defense-01'],
    pitfalls: (variant) => [rotateSuitInText('回头牌直接再丢，丢失安全张储备。', variant)]
  }
];

const buildStageQuestions = (
  stageId: RuleStageId,
  count: number,
  templates: QuestionTemplate[]
): TrainingQuestion[] => {
  const stageQuestions: TrainingQuestion[] = [];

  for (let i = 0; i < count; i += 1) {
    const template = templates[i % templates.length];
    const stageIndex = i + 1;
    const id = `${stageId}-${String(stageIndex).padStart(3, '0')}`;
    const variant = i;
    const options = template.options(variant);
    const correctOptionIds = template.correctOptionIds(variant);

    stageQuestions.push({
      id,
      stageId,
      type: template.type,
      difficulty: difficultyByIndex(i),
      prompt: `${stageMeta[stageId].name}题 ${stageIndex}: ${template.prompt(variant)}`,
      hand: template.hand(variant),
      discards: template.discards?.(variant),
      options,
      correctOptionIds,
      multiSelect: template.multiSelect ?? false,
      ruleRefs: template.ruleRefs,
      explanationSteps: createExplanationSteps(id, template.ruleRefs, options, correctOptionIds, variant),
      pitfalls: template.pitfalls(variant)
    });
  }

  return stageQuestions;
};

const openingQuestions = buildStageQuestions('opening', 24, openingTemplates);
const midgameQuestions = buildStageQuestions('midgame', 30, midgameTemplates);
const meldQuestions = buildStageQuestions('meld', 18, meldTemplates);
const defenseQuestions = buildStageQuestions('defense', 24, defenseTemplates);
const listeningQuestions = buildStageQuestions('listening', 24, listeningTemplates);

export const trainingQuestions: TrainingQuestion[] = [
  ...openingQuestions,
  ...midgameQuestions,
  ...meldQuestions,
  ...defenseQuestions,
  ...listeningQuestions
];

export const questionsById: Record<string, TrainingQuestion> = Object.fromEntries(
  trainingQuestions.map((question) => [question.id, question])
);

const chunk = <T>(list: T[], size: number) => {
  const result: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    result.push(list.slice(i, i + size));
  }
  return result;
};

const chapterByLevelIndex: RuleStageId[] = [
  'opening',
  'opening',
  'midgame',
  'midgame',
  'midgame',
  'meld',
  'meld',
  'defense',
  'defense',
  'listening',
  'listening',
  'listening'
];

const allQuestionIds = trainingQuestions.map((question) => question.id);
const levelQuestionChunks = chunk(allQuestionIds, 10);

export const challengeStages: ChallengeStage[] = levelQuestionChunks.map((questionIds, index) => {
  const chapterId = chapterByLevelIndex[index] ?? 'listening';
  const stageNumber = index + 1;
  return {
    id: `stage-${String(stageNumber).padStart(2, '0')}`,
    chapterId,
    title: `${stageMeta[chapterId].name}·第${stageNumber}关`,
    description: `10题闯关，章节重点：${stageMeta[chapterId].summary}`,
    questionIds,
    recommendedRuleTags: ruleTags.filter((tag) => tag.stageId === chapterId).map((tag) => tag.id)
  };
});

const exampleMap: Record<string, string[]> = Object.fromEntries(ruleTags.map((tag) => [tag.id, []]));

for (const question of trainingQuestions) {
  for (const ruleId of question.ruleRefs) {
    if (!exampleMap[ruleId]) continue;
    if (exampleMap[ruleId].length >= 6) continue;
    exampleMap[ruleId].push(question.id);
  }
}

export const ruleTagsWithExamples: RuleTag[] = ruleTags.map((tag) => ({
  ...tag,
  exampleQuestionIds: exampleMap[tag.id] ?? []
}));

export const questionStats = {
  total: trainingQuestions.length,
  byStage: {
    opening: openingQuestions.length,
    midgame: midgameQuestions.length,
    meld: meldQuestions.length,
    defense: defenseQuestions.length,
    listening: listeningQuestions.length
  }
};
