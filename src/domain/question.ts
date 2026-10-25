export type QuestionId = string;
export type RuleId = string;

interface BaseQuestion {
  id: QuestionId;
  chapter: number;
  rule: RuleId;
  difficulty: 1 | 2 | 3;
  prompt: string;
  answers: string[];
  explanation: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  kind: 'choice';
  distractors: string[];
}

export interface TypedQuestion extends BaseQuestion {
  kind: 'typed';
}

export interface ReorderQuestion extends BaseQuestion {
  kind: 'reorder';
  tiles: string[];
  decoys: string[];
}

export type Question = ChoiceQuestion | TypedQuestion | ReorderQuestion;

export interface Rule {
  id: RuleId;
  chapter: number;
  label: string;
}

export const shuffled = <T>(items: T[], random: () => number): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
};

export const optionsOf = (question: Question, random: () => number): string[] => {
  if (question.kind === 'choice') return shuffled([question.answers[0] ?? '', ...question.distractors], random);
  if (question.kind === 'reorder') return shuffled([...question.tiles, ...question.decoys], random);
  return [];
};
