// Formatadores compartilhados entre as telas de entregas (ativas e
// histórico) — extraídos daqui pra não duplicar a mesma lógica de exibição
// de data/valor em cada tela.

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(value) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}