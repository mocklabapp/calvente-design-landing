// @ts-check
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  projectCategoryIds,
  getProjectCategoryLabel,
  getProjectCategoryOptions,
} from '../src/lib/project-categories.ts';

const ids = [
  'residencial', 'docente', 'oficinas', 'planeamiento', 'industrial',
  'cultural', 'publico', 'rehabilitacion', 'interiorismo', 'sanitario',
];
const spanish = [
  'Residencial', 'Docente', 'Oficinas', 'Planeamiento', 'Industrial',
  'Cultural', 'Espacio público', 'Rehabilitación', 'Interiorismo', 'Sanitario',
];
const english = [
  'Residential', 'Educational', 'Offices', 'Urban planning', 'Industrial',
  'Cultural', 'Public space', 'Rehabilitation', 'Interior design', 'Healthcare',
];

test('catalog preserves all ten stored values and exact Spanish labels in order', () => {
  assert.deepEqual(projectCategoryIds, ids);
  assert.deepEqual(getProjectCategoryOptions('es'), ids.map((value, index) => ({
    value, label: spanish[index],
  })));
  ids.forEach((id, index) => assert.equal(getProjectCategoryLabel(id, 'es'), spanish[index]));
});

test('English changes labels only, not category values or order', () => {
  assert.deepEqual(getProjectCategoryOptions('en'), ids.map((value, index) => ({
    value, label: english[index],
  })));
  ids.forEach((id, index) => assert.equal(getProjectCategoryLabel(id, 'en'), english[index]));
});

test('missing and unknown values or languages never fall back or match prototype keys', () => {
  for (const value of [null, undefined, '', 'Residencial', ' residencial ', 'unknown', 'toString', '__proto__']) {
    assert.equal(getProjectCategoryLabel(value, 'es'), null);
  }
  for (const language of ['fr', 'ES', '', 'toString', '__proto__']) {
    assert.equal(getProjectCategoryLabel('residencial', language), null);
  }
});

test('editing returned options cannot alter subsequent labels or options', () => {
  const options = getProjectCategoryOptions('es');
  options[0].label = 'Changed';
  options.reverse();
  assert.equal(getProjectCategoryLabel('residencial', 'es'), 'Residencial');
  assert.deepEqual(getProjectCategoryOptions('es').map(({ value }) => value), ids);
});
