import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Question } from '../src/domain/question';
import { CONTENT_DIR, readContentJson, readQuestionFiles } from './content-files';
import { recordVerdicts, type JudgeVerdict, type VerdictFile } from './verdicts';

const [judgeOutput] = process.argv.slice(2);
if (!judgeOutput) {
  console.error('Usage: pnpm content:record-verdicts <judge-output.json>');
  process.exit(1);
}

const judged = JSON.parse(readFileSync(judgeOutput, 'utf8')) as JudgeVerdict[];
const file = recordVerdicts(readContentJson<VerdictFile>('verdicts.json'), judged, readQuestionFiles() as Question[]);
writeFileSync(join(CONTENT_DIR, 'verdicts.json'), `${JSON.stringify(file, null, 2)}\n`);

const failed = judged.filter(verdict => verdict.verdict === 'fail').map(verdict => verdict.id);
console.log(`${judged.length} verdicts recorded, ${failed.length} failed${failed.length > 0 ? `: ${failed.join(', ')}` : ''}.`);
