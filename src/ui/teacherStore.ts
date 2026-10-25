import { type } from 'arktype';
import { defineStore } from 'pinia';
import { computed, inject, ref } from 'vue';
import { addToRoster, chapterTable, classTable, toCsv } from '../domain/classroom';
import { decodeProgress, findCodes, type Progress } from '../domain/progressCode';
import { GAME_DEPS } from './deps';

export const TEACHER_KEY = 'grammar-trainer.teacher';

const rosterSchema = type({
  nickname: 'string',
  sharedAt: 'number',
  boxes: { '[string]': 'number' },
  seen: 'number[]',
  caught: { '[string]': 'number' },
  badges: type('string[]').default(() => []),
}).array();

export interface AddReport {
  added: number;
  found: number;
  typos: string[];
  newer: number;
  damaged: number;
}

export const useTeacherStore = defineStore('teacher', () => {
  const deps = inject(GAME_DEPS);
  if (!deps) throw new Error('GAME_DEPS is not provided');

  const load = (): Progress[] => {
    try {
      const parsed = rosterSchema(JSON.parse(deps.storage.getItem(TEACHER_KEY) ?? '[]'));
      return parsed instanceof type.errors ? [] : parsed;
    } catch {
      return [];
    }
  };

  const roster = ref<Progress[]>(load());
  const saveFailed = ref(false);

  const persist = () => {
    try {
      deps.storage.setItem(TEACHER_KEY, JSON.stringify(roster.value));
    } catch {
      saveFailed.value = true;
    }
  };

  const addCodes = async (text: string): Promise<AddReport> => {
    const codes = findCodes(text);
    const report: AddReport = { added: 0, found: codes.length, typos: [], newer: 0, damaged: 0 };
    const decoded: Progress[] = [];
    for (const code of codes) {
      const result = await decodeProgress(code);
      if (result.ok) decoded.push(result.progress);
      else if (result.error === 'newer-version') report.newer++;
      else if (result.error === 'corrupt') report.damaged++;
      else report.typos.push(code);
    }
    report.added = decoded.length;
    roster.value = addToRoster(roster.value, decoded);
    persist();
    return report;
  };

  const remove = (nickname: string) => {
    roster.value = roster.value.filter(progress => progress.nickname !== nickname);
    persist();
  };

  const chapters = [...new Set(deps.rules.map(rule => rule.chapter))].sort((a, b) => a - b);
  const chapter = ref<'all' | number>('all');

  const view = computed(() => {
    const ruleTable = classTable(roster.value, deps.questions, chapter.value === 'all' ? [] : deps.rules.filter(rule => rule.chapter === chapter.value));
    if (chapter.value !== 'all') {
      const columns = deps.rules.filter(rule => rule.chapter === chapter.value).map(rule => ({ key: rule.id, label: rule.label }));
      return { columns, rows: ruleTable.rows, average: ruleTable.average };
    }
    const byChapter = chapterTable(roster.value, deps.questions, chapters);
    const stringKeyed = (mastery: Record<number, number>): Record<string, number> => Object.fromEntries(Object.entries(mastery));
    return {
      columns: chapters.map(number => ({ key: String(number), label: `Ch. ${number}` })),
      rows: ruleTable.rows.map((row, index) => ({ ...row, mastery: stringKeyed(byChapter.rows[index]?.mastery ?? {}) })),
      average: stringKeyed(byChapter.average),
    };
  });
  const csv = computed(() => toCsv(classTable(roster.value, deps.questions, deps.rules), deps.rules));

  return { roster, saveFailed, view, chapters, chapter, csv, now: deps.now, addCodes, remove };
});
