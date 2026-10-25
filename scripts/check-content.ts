import { contentProblems } from '../src/domain/content';
import type { Question } from '../src/domain/question';
import { readContentJson, readQuestionFiles, readRuleFiles } from './content-files';
import { verdictProblems, type VerdictFile } from './verdicts';

const checkVerdicts = !process.argv.includes('--no-verdicts');
const questions = readQuestionFiles();

const schemaProblems = contentProblems(questions, readRuleFiles());
const problems =
  schemaProblems.length > 0 || !checkVerdicts ? schemaProblems : verdictProblems(questions as Question[], readContentJson<VerdictFile>('verdicts.json'));

if (problems.length > 0) {
  console.error(`${problems.length} content problem(s):\n${problems.map(problem => `  - ${problem}`).join('\n')}`);
  process.exit(1);
}
console.log(`${questions.length} questions checked${checkVerdicts ? '' : ' (schema only)'}.`);
