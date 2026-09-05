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

// Usado no dashboard para tempo médio até aceite / até conclusão da
// entrega. O backend já manda em minutos (com 1 casa decimal); aqui só
// decide a melhor unidade de exibição.
export function formatMinutes(value) {
  if (value == null) return '—';
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}