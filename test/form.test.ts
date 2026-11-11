import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAppointmentForm, buildWhatsAppLink } from '../src/utils/form.js';

test('validateAppointmentForm flags missing or short name', () => {
  const result = validateAppointmentForm({ nome: 'A', telefone: '11988887777', interesse: 'Clínica Geral' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.nome);
});

test('validateAppointmentForm flags invalid phone numbers', () => {
  const result = validateAppointmentForm({ nome: 'João da Silva', telefone: '123', interesse: 'Ortodontia' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.telefone);
});

test('validateAppointmentForm flags missing interest', () => {
  const result = validateAppointmentForm({ nome: 'Maria Santos', telefone: '11987654321', interesse: '' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.interesse);
});

test('validateAppointmentForm passes for complete valid data', () => {
  const result = validateAppointmentForm({
    nome: 'Carlos Eduardo',
    telefone: '(11) 98765-4321',
    interesse: 'Implantes',
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test('buildWhatsAppLink generates default greeting when no form data provided', () => {
  const link = buildWhatsAppLink('5511999998888');
  assert.equal(link, 'https://wa.me/5511999998888?text=Ol%C3%A1!%20Quero%20agendar%20uma%20consulta.');
});

test('buildWhatsAppLink formats customized query with user parameters', () => {
  const link = buildWhatsAppLink('5511999998888', {
    nome: 'Ana Clara',
    telefone: '11999990000',
    interesse: 'Clareamento Dental',
  });
  assert.ok(link.startsWith('https://wa.me/5511999998888?text='));
  assert.ok(decodeURIComponent(link).includes('Ana Clara'));
  assert.ok(decodeURIComponent(link).includes('Clareamento Dental'));
});
