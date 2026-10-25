import type { Question, Rule } from './domain/question';

const filesMatching = (files: Record<string, { default: unknown[] }>): unknown[] =>
  Object.keys(files)
    .sort()
    .flatMap(path => files[path]?.default ?? []);

export const questions = filesMatching(import.meta.glob('../content/chapter-*.json', { eager: true })) as Question[];
export const rules = filesMatching(import.meta.glob('../content/rules-*.json', { eager: true })) as Rule[];
