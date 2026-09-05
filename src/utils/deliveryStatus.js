// Mapeamento completo dos status do modelo Delivery (models/delivery.js na
// API) — usado pelo feed de "atividade recente" do dashboard, que mistura
// entregas em qualquer estado (diferente de EntregasPage, que só mostra
// 0-3, e HistoricoPage, que só mostra 4-6, cada uma com sua própria cópia
// reduzida dessa mesma tabela).
export const DELIVERY_STATUS_INFO = {
  0: { label: 'Aguardando entregador', badgeColor: 'warning' },
  1: { label: 'Aceita pelo entregador', badgeColor: 'purple' },
  2: { label: 'Pacote retirado', badgeColor: 'purple' },
  3: { label: 'A caminho', badgeColor: 'success' },
  4: { label: 'Entregue', badgeColor: 'success' },
  5: { label: 'Devolvida', badgeColor: 'warning' },
  6: { label: 'Cancelada', badgeColor: 'failure' },
};

export function getDeliveryStatusInfo(status) {
  return DELIVERY_STATUS_INFO[status] ?? { label: 'Status desconhecido', badgeColor: 'gray' };
}