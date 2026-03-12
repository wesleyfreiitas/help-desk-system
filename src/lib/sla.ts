// Regras de SLA:
// Alta: primeira resposta em 1 hora e resolução em 4 horas
// Média: primeira resposta em 4 horas e resolução em 1 dia útil (8 hrs)
// Baixa: primeira resposta em 8 horas e resolução em 3 dias úteis (24 hrs)

type Priority = 'ALTA' | 'MEDIA' | 'BAIXA';

const SLA_CONFIG = {
  ALTA: { responseHours: 1, resolveHours: 4 },
  MEDIA: { responseHours: 4, resolveHours: 8 }, // Assumindo 1 dia útil = 8 horas úteis
  BAIXA: { responseHours: 8, resolveHours: 24 }, // Assumindo 3 dias úteis = 24 horas úteis
};

/**
 * Calcula a data de expiração adicionando horas úteis (simplificado para adicionar horas corridas, 
 * para uma implementação super rigorosa de dias úteis, seria necessário pular finais de semana e fora de horário comercial)
 * Para o escopo deste projeto, faremos uma adição direta.
 */
export function calculateSLA(priority: Priority, startDate = new Date()) {
  const config = SLA_CONFIG[priority] || SLA_CONFIG['MEDIA'];
  
  const responseDate = new Date(startDate.getTime() + config.responseHours * 60 * 60 * 1000);
  const resolveDate = new Date(startDate.getTime() + config.resolveHours * 60 * 60 * 1000);

  return {
    slaResponseDate: responseDate,
    slaResolveDate: resolveDate,
  };
}

export function isSlaViolated(slaDate: Date | null, targetDate: Date | null = new Date()) {
  if (!slaDate || !targetDate) return false;
  return targetDate > slaDate;
}
