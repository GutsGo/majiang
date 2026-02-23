import { ruleTags, stageMeta, stageOrder } from '@/data/rules';
import type {
  ChallengeStage,
  ExplanationStep,
  QuestionOption,
  QuestionType,
  RuleStageId,
  RuleTag,
  TrainingQuestion,
} from '@/types/training';
import rawQuestionData from '@/assets/120_questions.json';

type RawQuestionOption = {
  id: string;
  label: string;
};

type RawQuestion = {
  id: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  stage: RuleStageId;
  type: 'discard_best' | 'true_false' | 'wait_tiles' | 'scenario_analysis';
  multiSelect?: boolean;
  prompt: string;
  hand: string[];
  discards?: string[];
  options: RawQuestionOption[];
  correctOptionIds: string[];
  ruleRefs: string[];
  explanation: string;
  pitfalls?: string[];
};

type RawQuestionBank = {
  questions: RawQuestion[];
};

const questionBank = rawQuestionData as RawQuestionBank;

const difficultyMap: Record<RawQuestion['difficulty'], 1 | 2 | 3> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const typeMap: Record<RawQuestion['type'], QuestionType> = {
  discard_best: 'discard_best',
  true_false: 'true_false',
  wait_tiles: 'wait_tiles',
  scenario_analysis: 'choose_strategy',
};

const ruleMap = new Map(ruleTags.map((tag) => [tag.id, tag]));

const buildExplanationSteps = (
  questionId: string,
  explanation: string,
  ruleRefs: string[],
  options: QuestionOption[],
  correctOptionIds: string[],
): ExplanationStep[] => {
  const correctLabels = options
    .filter((option) => correctOptionIds.includes(option.id))
    .map((option) => option.label)
    .join('、');
  const ruleNotes = ruleRefs
    .map((ruleId) => {
      const rule = ruleMap.get(ruleId);
      if (!rule) return ruleId;
      return `${rule.title}（${rule.mnemonic}）`;
    })
    .join('；');

  const steps: ExplanationStep[] = [
    {
      id: `${questionId}-step-1`,
      title: '解析要点',
      detail: explanation || '暂无解析。',
    },
  ];

  if (ruleNotes) {
    steps.push({
      id: `${questionId}-step-2`,
      title: '对应口诀',
      detail: ruleNotes,
    });
  }

  steps.push({
    id: `${questionId}-step-3`,
    title: '最佳选择',
    detail: `本题正确答案：${correctLabels || '暂无'}。`,
  });

  return steps;
};

const formatQuestionId = (id: number) => `q-${String(id).padStart(3, '0')}`;

export const trainingQuestions: TrainingQuestion[] = questionBank.questions.map(
  (question) => {
    const id = formatQuestionId(question.id);
    const options: QuestionOption[] = question.options.map((option) => ({
      id: option.id,
      label: option.label,
    }));
    const correctOptionIds = question.correctOptionIds;

    return {
      id,
      stageId: question.stage,
      type: typeMap[question.type] ?? 'analyze_situation',
      difficulty: difficultyMap[question.difficulty],
      prompt: question.prompt,
      hand: question.hand,
      discards:
        question.discards && question.discards.length
          ? question.discards
          : undefined,
      options,
      correctOptionIds,
      multiSelect: question.multiSelect ?? correctOptionIds.length > 1,
      ruleRefs: question.ruleRefs,
      explanationSteps: buildExplanationSteps(
        id,
        question.explanation,
        question.ruleRefs,
        options,
        correctOptionIds,
      ),
      pitfalls:
        question.pitfalls && question.pitfalls.length
          ? question.pitfalls
          : ['注意结合牌势与风险控制。'],
    };
  },
);

export const questionsById: Record<string, TrainingQuestion> =
  Object.fromEntries(
    trainingQuestions.map((question) => [question.id, question]),
  );

const chunk = <T>(list: T[], size: number) => {
  const result: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    result.push(list.slice(i, i + size));
  }
  return result;
};

const pickChapterId = (questions: TrainingQuestion[]): RuleStageId => {
  if (!questions.length) return 'opening';
  const counts = new Map<RuleStageId, number>();
  for (const question of questions) {
    counts.set(question.stageId, (counts.get(question.stageId) ?? 0) + 1);
  }
  const ranked = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return stageOrder.indexOf(a[0]) - stageOrder.indexOf(b[0]);
  });
  return ranked[0]?.[0] ?? questions[0].stageId;
};

const levelQuestionChunks = chunk(trainingQuestions, 10);

// 配置每关难度（1~3）。按关卡顺序填写，不足部分默认 2。
const stageDifficultyPlan: Array<1 | 2 | 3> = [
  1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3,
];

const pickStageDifficulty = (stageNumber: number): 1 | 2 | 3 => {
  return stageDifficultyPlan[stageNumber - 1] ?? 2;
};

export const challengeStages: ChallengeStage[] = levelQuestionChunks.map(
  (questions, index) => {
    const chapterId = pickChapterId(questions);
    const stageNumber = index + 1;
    return {
      id: `stage-${String(stageNumber).padStart(2, '0')}`,
      chapterId,
      title: `${stageMeta[chapterId].name}·第${stageNumber}关`,
      description: `10题闯关，章节重点：${stageMeta[chapterId].summary}`,
      questionIds: questions.map((question) => question.id),
      recommendedRuleTags: ruleTags
        .filter((tag) => tag.stageId === chapterId)
        .map((tag) => tag.id),
      difficulty: pickStageDifficulty(stageNumber),
    };
  },
);

const exampleMap: Record<string, string[]> = Object.fromEntries(
  ruleTags.map((tag) => [tag.id, []]),
);

for (const question of trainingQuestions) {
  for (const ruleId of question.ruleRefs) {
    if (!exampleMap[ruleId]) continue;
    if (exampleMap[ruleId].length >= 6) continue;
    exampleMap[ruleId].push(question.id);
  }
}

export const ruleTagsWithExamples: RuleTag[] = ruleTags.map((tag) => ({
  ...tag,
  exampleQuestionIds: exampleMap[tag.id] ?? [],
}));

const stageCounts: Record<RuleStageId, number> = {
  opening: 0,
  midgame: 0,
  meld: 0,
  defense: 0,
  listening: 0,
};

for (const question of trainingQuestions) {
  stageCounts[question.stageId] += 1;
}

export const questionStats = {
  total: trainingQuestions.length,
  byStage: stageCounts,
};
