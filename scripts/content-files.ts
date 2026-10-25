import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Rule } from '../src/domain/question';

export const CONTENT_DIR = join(import.meta.dirname, '..', 'content');

export const readContentJson = <T>(file: string): T => JSON.parse(readFileSync(join(CONTENT_DIR, file), 'utf8')) as T;

const readAll = (pattern: RegExp): unknown[] =>
  readdirSync(CONTENT_DIR)
    .filter(file => pattern.test(file))
    .sort()
    .flatMap(file => readContentJson<unknown[]>(file));

export const readQuestionFiles = (): unknown[] => readAll(/^chapter-\d+(-gym)?\.json$/);

export const readRuleFiles = (): Rule[] => readAll(/^rules-\d+\.json$/) as Rule[];
