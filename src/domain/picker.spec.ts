import { describe, expect, it } from 'vitest';
import { aQuestion, sequence } from './testing';
import { nextQuestion } from './picker';

const NOW = 1_800_000_000_000;
const first = sequence(0);

describe('nextQuestion', () => {
  it('picks a missed question that is due before anything else', () => {
    const questions = [aQuestion({ id: 'new' }), aQuestion({ id: 'reviewed' }), aQuestion({ id: 'missed' })];
    const cards = { reviewed: { box: 3, dueAt: NOW - 1 }, missed: { box: 1, dueAt: NOW - 1 } };

    const question = nextQuestion(questions, cards, NOW, first);

    expect(question.id).toBe('missed');
  });

  it('picks a due review before a question never seen', () => {
    const questions = [aQuestion({ id: 'new' }), aQuestion({ id: 'reviewed' })];
    const cards = { reviewed: { box: 3, dueAt: NOW } };

    const question = nextQuestion(questions, cards, NOW, first);

    expect(question.id).toBe('reviewed');
  });

  it('picks a question never seen when no review is due', () => {
    const questions = [aQuestion({ id: 'later' }), aQuestion({ id: 'new' })];
    const cards = { later: { box: 2, dueAt: NOW + 1 } };

    const question = nextQuestion(questions, cards, NOW, first);

    expect(question.id).toBe('new');
  });

  it('picks the lowest box when nothing is due and everything was seen', () => {
    const questions = [aQuestion({ id: 'box4' }), aQuestion({ id: 'box2' })];
    const cards = { box4: { box: 4, dueAt: NOW + 10 }, box2: { box: 2, dueAt: NOW + 20 } };

    const question = nextQuestion(questions, cards, NOW, first);

    expect(question.id).toBe('box2');
  });

  it('avoids a missed question asked recently', () => {
    const questions = [aQuestion({ id: 'missed' }), aQuestion({ id: 'other' }), aQuestion({ id: 'new' })];
    const cards = { missed: { box: 1, dueAt: NOW }, other: { box: 2, dueAt: NOW } };

    const question = nextQuestion(questions, cards, NOW, first, ['missed', 'other']);

    expect(question.id).toBe('new');
  });

  it('asks again a missed question once it is out of the recent list', () => {
    const questions = [aQuestion({ id: 'missed' }), aQuestion({ id: 'new' })];
    const cards = { missed: { box: 1, dueAt: NOW } };

    const question = nextQuestion(questions, cards, NOW, first, []);

    expect(question.id).toBe('missed');
  });

  it('avoids only the last question when every question was asked recently', () => {
    const questions = [aQuestion({ id: 'q1' }), aQuestion({ id: 'q2' })];

    const question = nextQuestion(questions, {}, NOW, first, ['q1', 'q2']);

    expect(question.id).toBe('q1');
  });

  it('repeats the last question when it is the only one', () => {
    const questions = [aQuestion({ id: 'only' })];

    const question = nextQuestion(questions, {}, NOW, first, ['only']);

    expect(question.id).toBe('only');
  });

  it('picks randomly within the highest-priority group', () => {
    const questions = [aQuestion({ id: 'n1' }), aQuestion({ id: 'n2' }), aQuestion({ id: 'n3' })];

    const question = nextQuestion(questions, {}, NOW, sequence(0.99));

    expect(question.id).toBe('n3');
  });
});
