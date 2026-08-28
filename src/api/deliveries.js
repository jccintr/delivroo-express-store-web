import { api } from './client';

// POST /stores/deliveries — cria uma nova entrega para a loja autenticada.
// Nenhum rider é escolhido neste momento (atribuição/aceite acontece depois).
// Body: {
//   destino: { nome, telefone, address },
//   package: { description, category?, quantity?, weight?, declaredvalue?, notes?, payment?, cashChange? }
// }
export function createDelivery(payload) {
  return api.post('/stores/deliveries', payload, { auth: true });
}

// GET /stores/deliveries/active — lista as entregas da loja autenticada que
// ainda estão em andamento (status 0 aguardando entregador, 1 aceita,
// 2 retirada ou 3 a caminho). Entregas em estado final (entregue, devolvida,
// cancelada) não vêm nessa lista. Quando já houver entregador atribuído, os
// dados básicos dele vêm populados (name, phone, avatar, vehicle, rating).
export function listStoreActiveDeliveries() {
  return api.get('/stores/deliveries/active', { auth: true });
}

// POST /stores/deliveries/:id/cancel — cancela uma entrega da loja
// autenticada. Só é permitido enquanto o pacote ainda não foi retirado
// (status 0 aguardando entregador ou 1 aceita); a partir da retirada (2+)
// a API recusa com 409. Body: { motivo } (mínimo 3 caracteres).
export function cancelStoreDelivery(id, motivo) {
  return api.post(`/stores/deliveries/${id}/cancel`, { motivo }, { auth: true });
}

// GET /stores/deliveries/history — histórico de entregas finalizadas
// (entregue, devolvida ou cancelada) da loja autenticada. Sempre paginado,
// já que esse conjunto só cresce. Aceita filtros opcionais por status
// ('delivered' | 'returned' | 'cancelled'), período (from/to, formato
// AAAA-MM-DD, aplicado sobre createdAt) e paginação (page/limit).
// Retorna { data, page, limit, total, totalPages }.
export function listStoreDeliveryHistory({ status, from, to, page, limit } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const query = params.toString();
  return api.get(`/stores/deliveries/history${query ? `?${query}` : ''}`, { auth: true });
}