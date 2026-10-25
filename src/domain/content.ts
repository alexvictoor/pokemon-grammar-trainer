import { type } from 'arktype';
import type { Rule } from './question';

const text = type('string.trim').to('string > 0');

const base = {
  id: /^[a-z0-9-]+$/,
  chapter: 'number.integer',
  rule: 'string',
  difficulty: '1 | 2 | 3',
  prompt: text,
  answers: text.array().atLeastLength(1),
  explanation: text,
} as const;

const questionSchema = type({ ...base, kind: "'choice'", distractors: text.array().atLeastLength(2).atMostLength(3) })
  .or({ ...base, kind: "'typed'" })
  .or({ ...base, kind: "'reorder'", tiles: text.array().atLeastLength(3), decoys: text.array() });

const idOf = (question: unknown): string =>
  typeof question === 'object' && question !== null && 'id' in question ? String(question.id) : '(no id)';

export const contentProblems = (questions: unknown[], rules: Rule[]): string[] => {
  const rulesById = new Map(rules.map(rule => [rule.id, rule]));
  const seenIds = new Set<string>();
  const problems: string[] = [];

  for (const raw of questions) {
    const id = idOf(raw);
    const question = questionSchema(raw);
    if (question instanceof type.errors) {
      problems.push(...question.map(error => `${id}: ${error.message}`));
      continue;
    }
    if (seenIds.has(id)) problems.push(`${id}: duplicated id`);
    seenIds.add(id);

    const rule = rulesById.get(question.rule);
    if (!rule) problems.push(`${id}: unknown rule "${question.rule}"`);
    else if (rule.chapter !== question.chapter) problems.push(`${id}: chapter ${question.chapter} differs from the chapter of rule "${rule.id}" (${rule.chapter})`);

    problems.push(...kindProblems(id, question));
  }
  return problems;
};

const kindProblems = (id: string, question: typeof questionSchema.infer): string[] => {
  if (question.kind === 'reorder') {
    const spelled = question.tiles.join(' ');
    return [
      ...(spelled === question.answers[0] ? [] : [`${id}: the tiles spell "${spelled}", not the first answer`]),
      ...question.decoys.filter(decoy => question.tiles.includes(decoy)).map(decoy => `${id}: "${decoy}" is both a tile and a decoy`),
    ];
  }
  const blank = question.prompt.includes('___') ? [] : [`${id}: the prompt has no ___ blank`];
  if (question.kind === 'typed') return blank;
  return [
    ...question.answers.filter(answer => question.distractors.includes(answer)).map(answer => `${id}: "${answer}" is both an answer and a distractor`),
    ...blank,
  ];
};
