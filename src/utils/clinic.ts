export interface ClinicStatus {
  isOpen: boolean;
  label: string;
  todayIndex: number; // 0 = Domingo, 1 = Segunda ... 6 = Sábado
}

export interface ExtendedAppointmentData {
  nome: string;
  telefone: string;
  interesse: string;
  preferencia?: string;
  observacao?: string;
}

/**
 * Computes clinic open/closed status based on São Paulo clinic hours:
 * Mon–Fri: 08:00–19:00
 * Sat: 08:00–13:00
 * Sun: Closed
 */
export function getClinicStatus(date: Date): ClinicStatus {
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();

  const openMinutes = 8 * 60; // 08:00
  const weekdayClose = 19 * 60; // 19:00
  const saturdayClose = 13 * 60; // 13:00

  if (day >= 1 && day <= 5) {
    if (minutes >= openMinutes && minutes < weekdayClose) {
      return { isOpen: true, label: 'Aberto agora', todayIndex: day };
    }
    if (minutes < openMinutes) {
      return { isOpen: false, label: 'Fechado, abre hoje às 8h', todayIndex: day };
    }
    if (day === 5) {
      return { isOpen: false, label: 'Fechado, abre amanhã às 8h', todayIndex: day };
    }
    return { isOpen: false, label: 'Fechado, abre amanhã às 8h', todayIndex: day };
  }

  if (day === 6) {
    if (minutes >= openMinutes && minutes < saturdayClose) {
      return { isOpen: true, label: 'Aberto agora', todayIndex: day };
    }
    if (minutes < openMinutes) {
      return { isOpen: false, label: 'Fechado, abre hoje às 8h', todayIndex: day };
    }
    return { isOpen: false, label: 'Fechado, abre segunda às 8h', todayIndex: day };
  }

  // Sunday (0)
  return { isOpen: false, label: 'Fechado, abre amanhã às 8h', todayIndex: day };
}

export function validateExtendedAppointment(
  data: Partial<ExtendedAppointmentData>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.nome || data.nome.trim().length < 2) {
    errors.nome = 'Por favor, informe seu nome completo.';
  }

  const digits = (data.telefone || '').replace(/\D/g, '');
  if (!data.telefone || digits.length < 10) {
    errors.telefone = 'Por favor, informe um telefone válido com DDD.';
  }

  if (!data.interesse || data.interesse.trim().length === 0) {
    errors.interesse = 'Por favor, selecione uma especialidade.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildClinicWhatsAppUrl(
  data: ExtendedAppointmentData,
  phone: string = '5511999998888'
): string {
  const cleanPhone = phone.replace(/\D/g, '');
  let message = 'Olá! Gostaria de agendar uma consulta na Clínica Sorriso Pleno.\n\n';
  message += `*Nome:* ${data.nome.trim()}\n`;
  message += `*Telefone:* ${data.telefone.trim()}\n`;
  message += `*Especialidade:* ${data.interesse.trim()}`;

  if (data.preferencia && data.preferencia.trim()) {
    message += `\n*Preferência de horário:* ${data.preferencia.trim()}`;
  }
  if (data.observacao && data.observacao.trim()) {
    message += `\n*Observações:* ${data.observacao.trim()}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
