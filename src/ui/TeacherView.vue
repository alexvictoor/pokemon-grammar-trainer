<script setup lang="ts">
import { ref } from 'vue';
import { CHAPTER_TITLES } from '../domain/region';
import type { AddReport } from './teacherStore';
import { useTeacherStore } from './teacherStore';

const store = useTeacherStore();
const pasted = ref('');
const report = ref<AddReport>();
const csvCopied = ref(false);

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const masteryLevel = (value: number) => (value >= 70 ? 'high' : value >= 40 ? 'mid' : 'low');
const shortDate = (epochMs: number) => new Date(epochMs).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const today = () => new Date(store.now()).toISOString().slice(0, 10);

const addCodes = async () => {
  report.value = await store.addCodes(pasted.value);
  if (report.value.added > 0 && report.value.typos.length === 0 && report.value.newer === 0 && report.value.damaged === 0) pasted.value = '';
};

const downloadCsv = () => {
  const url = URL.createObjectURL(new Blob([`﻿${store.csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `class-progress-${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const copyCsv = async () => {
  try {
    await navigator.clipboard.writeText(store.csv);
    csvCopied.value = true;
  } catch {
    csvCopied.value = false;
  }
};
</script>

<template>
  <section class="teacher">
    <div class="panel stack">
      <h2 class="pixel">Class progress</h2>
      <p class="hint">Paste the messages your students sent. Each one holds a code that starts with GT1-. A newer code from the same nickname replaces the older one.</p>
      <label for="teacher-codes">Messages or codes</label>
      <textarea id="teacher-codes" v-model="pasted" rows="5"></textarea>
      <button id="add-codes" type="button" class="primary" @click="addCodes">Add to the class</button>

      <div v-if="report" class="report" role="status">
        <p v-if="report.found === 0">No code found. Codes start with GT1-.</p>
        <p v-if="report.added > 0">{{ plural(report.added, 'code added.', 'codes added.') }}</p>
        <p v-if="report.typos.length > 0" class="error">
          {{ plural(report.typos.length, 'code has a typo or is incomplete', 'codes have a typo or are incomplete') }}:
          {{ report.typos.map(code => `${code.slice(0, 16)}…`).join(', ') }}
        </p>
        <p v-if="report.newer > 0" class="error">{{ plural(report.newer, 'code comes', 'codes come') }} from a newer version of the game.</p>
        <p v-if="report.damaged > 0" class="error">{{ plural(report.damaged, 'code is damaged', 'codes are damaged') }}.</p>
      </div>
      <p v-if="store.saveFailed" class="error" role="alert">This browser cannot keep the class list. Export it as CSV before closing the page.</p>
    </div>

    <div v-if="store.view.rows.length > 0" class="panel stack">
      <label for="teacher-chapter">Show</label>
      <select id="teacher-chapter" v-model="store.chapter">
        <option value="all">All chapters</option>
        <option v-for="chapter in store.chapters" :key="chapter" :value="chapter">Chapter {{ chapter }} · {{ CHAPTER_TITLES[chapter] }}</option>
      </select>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Student</th>
              <th scope="col">Caught</th>
              <th v-for="column in store.view.columns" :key="column.key" scope="col">{{ column.label }}</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in store.view.rows" :key="row.nickname">
              <th scope="row" :title="`Shared on ${shortDate(row.sharedAt)}`">{{ row.nickname }}</th>
              <td class="number">{{ row.caught }}</td>
              <td v-for="column in store.view.columns" :key="column.key" class="number mastery" :class="masteryLevel(row.mastery[column.key] ?? 0)">
                {{ row.mastery[column.key] ?? 0 }}%
              </td>
              <td>
                <button type="button" class="remove" :aria-label="`Remove ${row.nickname}`" @click="store.remove(row.nickname)">Remove</button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Class average</th>
              <td></td>
              <td v-for="column in store.view.columns" :key="column.key" class="number mastery" :class="masteryLevel(store.view.average[column.key] ?? 0)">
                {{ store.view.average[column.key] ?? 0 }}%
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p class="hint">A student can edit a code. Use this table to follow progress, not to grade.</p>
      <div class="actions">
        <button id="download-csv" type="button" class="secondary" @click="downloadCsv">Download CSV</button>
        <button id="copy-csv" type="button" class="secondary" @click="copyCsv">{{ csvCopied ? 'Copied!' : 'Copy CSV' }}</button>
      </div>
    </div>

    <a class="back" href="#">Open the game</a>
  </section>
</template>

<style scoped>
.teacher {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h2 {
  margin: 0;
}

label {
  font-weight: 600;
}

select {
  padding: 10px 12px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
}

textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
  color: var(--ink);
  font: 14px/1.4 ui-monospace, monospace;
  resize: vertical;
}

.hint {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.report p {
  margin: 0;
}

.error {
  color: var(--bad);
  font-weight: 600;
}

.table-wrap {
  position: relative;
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  width: 100%;
  font-size: 14px;
}

th,
td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: middle;
}

thead th {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  min-width: 80px;
}

tbody th,
tfoot th {
  white-space: nowrap;
}

.number {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.mastery.high {
  color: var(--good);
  font-weight: 700;
}

.mastery.mid {
  color: var(--ink);
}

.mastery.low {
  color: var(--bad);
}

tfoot th,
tfoot td {
  font-weight: 700;
  border-top: 2px solid var(--frame);
}

.remove {
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.back {
  color: var(--accent);
  text-align: center;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
