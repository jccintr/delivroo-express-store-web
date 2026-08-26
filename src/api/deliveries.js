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