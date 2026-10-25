import { createHash } from 'node:crypto';
import type { Question } from '../src/domain/question';

export interface Verdict {
  hash: string;
  verdict: 'pass' | 'fail';
  reasons?: string[];
  override?: string;
}

export interface VerdictFile {
  gate: boolean;
  verdicts: Partial<Record<string, Verdict>>;
}

const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical((value as Record<string, unknown>)[key])]));
  }
  return value;
};

export const questionHash = (question: Question): string => createHash('sha256').update(JSON.stringify(canonical(question))).digest('hex').slice(0, 16);

export interface JudgeVerdict {
  id: string;
  verdict: 'pass' | 'fail';
  criteria: Record<string, { pass: boolean; reason: string }>;
}

export const recordVerdicts = (file: VerdictFile, judged: JudgeVerdict[], questions: Question[]): VerdictFile => {
  const questionsById = new Map(questions.map(question => [question.id, question]));
  const recorded = judged.map(({ id, verdict, criteria }): [string, Verdict] => {
    const question = questionsById.get(id);
    if (!question) throw new Error(`No question with id ${id}`);
    const reasons = Object.entries(criteria)
      .filter(([, criterion]) => !criterion.pass)
      .map(([name, criterion]) => `${name}: ${criterion.reason}`);
    return [id, reasons.length > 0 ? { hash: questionHash(question), verdict, reasons } : { hash: questionHash(question), verdict }];
  });
  return { ...file, verdicts: { ...file.verdicts, ...Object.fromEntries(recorded) } };
};

export const verdictProblems =(questions: Question[], file: VerdictFile): string[] => {
  if (!file.gate) return [];
  return questions.flatMap(question => {
    const verdict = file.verdicts[question.id];
    if (!verdict) return [`${question.id}: not judged yet`];
    if (verdict.hash !== questionHash(question)) return [`${question.id}: edited since it was judged`];
    if (verdict.verdict === 'fail' && !verdict.override) return [`${question.id}: failed (${(verdict.reasons ?? []).join('; ')})`];
    return [];
  });
};
