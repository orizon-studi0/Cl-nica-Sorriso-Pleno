/**
 * Pure helper functions for the WhatsApp appointment message and form validation.
 */

export interface AppointmentData {
  nome: string;
  telefone: string;
  interesse: string;
}

export function validateAppointmentForm(data: Partial<AppointmentData>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.nome || data.nome.trim().length < 2) {
    errors.nome = 'Por favor, informe seu nome completo (mínimo 2 caracteres).';
  }

  const phoneDigits = (data.telefone || '').replace(/\D/g, '');
  if (!data.telefone || phoneDigits.length < 10) {
    errors.telefone = 'Por favor, informe um número de telefone/WhatsApp válido com DDD.';
  }

  if (!data.interesse || data.interesse.trim().length === 0) {
    errors.interesse = 'Por favor, selecione a área ou procedimento de interesse.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildWhatsAppLink(
  basePhone: string = '5511999998888',
  data?: AppointmentData
): string {
  const cleanPhone = basePhone.replace(/\D/g, '');
  if (!data || !data.nome) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Olá! Quero agendar uma consulta.')}`;
  }

  const message = `Olá! Gostaria de agendar uma consulta na Clínica Sorriso Pleno.\n\n` +
    `*Nome:* ${data.nome.trim()}\n` +
    `*Telefone:* ${data.telefone.trim()}\n` +
    `*Interesse:* ${data.interesse.trim()}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
