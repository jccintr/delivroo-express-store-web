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