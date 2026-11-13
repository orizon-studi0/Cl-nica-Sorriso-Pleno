import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getClinicStatus,
  validateExtendedAppointment,
  buildClinicWhatsAppUrl,
} from '../src/utils/clinic.js';

test('getClinicStatus detects open hours on weekday', () => {
  const wednesday10am = new Date('2026-11-11T10:30:00');
  const status = getClinicStatus(wednesday10am);
  assert.equal(status.isOpen, true);
  assert.equal(status.label, 'Aberto agora');
  assert.equal(status.todayIndex, 3);
});

test('getClinicStatus detects closed before 8am on weekday', () => {
  const tuesday7am = new Date('2026-11-10T07:15:00');
  const status = getClinicStatus(tuesday7am);
  assert.equal(status.isOpen, false);
  assert.equal(status.label, 'Fechado, abre hoje às 8h');
});

test('getClinicStatus detects closed on Saturday afternoon and opens Monday', () => {
  const saturday2pm = new Date('2026-11-14T14:00:00');
  const status = getClinicStatus(saturday2pm);
  assert.equal(status.isOpen, false);
  assert.equal(status.label, 'Fechado, abre segunda às 8h');
});

test('getClinicStatus detects Sunday closed and opens tomorrow', () => {
  const sunday = new Date('2026-11-15T11:00:00');
  const status = getClinicStatus(sunday);
  assert.equal(status.isOpen, false);
  assert.equal(status.label, 'Fechado, abre amanhã às 8h');
});

test('validateExtendedAppointment preserves required inline error messages', () => {
  const invalid = validateExtendedAppointment({ nome: '', telefone: '1199', interesse: '' });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.nome, 'Por favor, informe seu nome completo.');
  assert.equal(invalid.errors.telefone, 'Por favor, informe um telefone válido com DDD.');
  assert.equal(invalid.errors.interesse, 'Por favor, selecione uma especialidade.');
});

test('buildClinicWhatsAppUrl includes specialty, time preference, and notes', () => {
  const url = buildClinicWhatsAppUrl({
    nome: 'Fernanda Lima',
    telefone: '(11) 98765-4321',
    interesse: 'Ortodontia',
    preferencia: 'Manhã',
    observacao: 'Convênio SulAmérica',
  });
  const decoded = decodeURIComponent(url);
  assert.ok(decoded.includes('Fernanda Lima'));
  assert.ok(decoded.includes('Ortodontia'));
  assert.ok(decoded.includes('Manhã'));
  assert.ok(decoded.includes('Convênio SulAmérica'));
});
