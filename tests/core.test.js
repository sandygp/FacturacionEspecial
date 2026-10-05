import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adaptiveStep, canDoLevel, overallLevel, buildPlan, minutesForDate, planHours, analyzeText, wordMatch, makeInviteCode, dateKey, addDays } from '../src/core.js';
import { D } from '../src/data.js';

const B1 = { reading: 3, listening: 2, grammar: 1, vocabulary: 3, writing: 2, speaking: 1 };

test('el diagnóstico adaptativo sube hasta fallar y se queda en el último nivel superado', () => {
  const tried = {};
  assert.deepEqual(adaptiveStep(tried, 2, true), { level: 3 });
  assert.deepEqual(adaptiveStep(tried, 3, false), { final: 2 });
});
test('el diagnóstico baja si falla y termina en A1 marcando "por debajo"', () => {
  const tried = {};
  assert.deepEqual(adaptiveStep(tried, 2, false), { level: 1 });
  assert.deepEqual(adaptiveStep(tried, 1, false), { level: 0 });
  assert.deepEqual(adaptiveStep(tried, 0, false), { final: 0, below: true });
});
test('los descriptores «puedo» exigen la mitad de cada nivel sin saltos', () => {
  assert.equal(canDoLevel([2, 1, 0, 2, 0, 0], D.cando.speaking), 1);
  assert.equal(canDoLevel([0, 2, 2, 2, 2, 2], D.cando.speaking), -1);
});
test('el nivel global de un perfil mixto es B1', () => assert.equal(overallLevel(B1), 2));

test('plan por tiempo: reparte todos los minutos y prioriza las destrezas débiles', () => {
  const p = buildPlan(B1, { mode: 'time', minutes: 45, days: 5 });
  assert.equal(p.target, 3);
  const blocks = p.schedule.flatMap(d => d.blocks);
  assert.equal(blocks.length, 15);
  assert.ok(p.counts.grammar > p.counts.reading);
  assert.equal(p.schedule[5].blocks.length, 0);
});
test('plan por fecha: calcula los minutos diarios necesarios', () => {
  const date = dateKey(addDays(new Date(), 36 * 7));
  const p = buildPlan(B1, { mode: 'date', date, days: 5 });
  assert.equal(p.minutes, minutesForDate(planHours(B1), date, 5));
  assert.ok(p.minutes >= 60 && p.minutes <= 90, `minutos: ${p.minutes}`);
  assert.equal(p.targetDate, date);
});
test('el análisis de texto necesita 20 palabras y reconoce conectores', () => {
  assert.equal(analyzeText('Too short text.').estimate, null);
  const a = analyzeText('I would like to visit Japan because I love its culture. However, it is expensive, so I would need to save money first. My sister, who has always wanted to see Kyoto, would come with me.');
  assert.ok(a.estimate >= 1);
  assert.ok(a.conn.mid.includes('however'));
});
test('shadowing compara palabras sin importar la puntuación', () => assert.equal(wordMatch('Nice to meet you.', 'nice to meet you'), 1));
test('los códigos de invitación usan el nivel del nombre del grupo', () => assert.match(makeInviteCode('B1 · martes'), /^B1-[A-Z2-9]{3}-[A-Z2-9]{3}$/));
