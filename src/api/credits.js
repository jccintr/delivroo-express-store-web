import { api } from './client';

// GET /stores/credits — saldo (free, purchased, available, openDeliveries,
// availableToRequest) + pedido de recarga em aberto (com QR code), se houver.
export function getCredits() {
  return api.get('/stores/credits', { auth: true });
}

// GET /stores/credits/packages — { deliveryFee, packages: [{ id, name, deliveries, price, unitPrice }] }
export function listPackages() {
  return api.get('/stores/credits/packages', { auth: true });
}

// POST /stores/credits/orders — cria o pedido e devolve o Pix (QR + copia e cola).
export function createRechargeOrder(packageId) {
  return api.post('/stores/credits/orders', { packageId }, { auth: true });
}

// GET /stores/credits/orders — histórico de pedidos de recarga.
export function listRechargeOrders(page = 1) {
  return api.get(`/stores/credits/orders?page=${page}&limit=10`, { auth: true });
}

// POST /stores/credits/orders/:id/inform — "Já paguei". Comprovante e
// observação são opcionais; o saldo só entra depois que o admin confirma.
export function informPayment(id, { payerNote, receipt } = {}) {
  const form = new FormData();
  if (payerNote) form.append('payerNote', payerNote);
  if (receipt) form.append('receipt', receipt);
  return api.postForm(`/stores/credits/orders/${id}/inform`, form, { auth: true });
}

// POST /stores/credits/orders/:id/cancel — só enquanto ainda não informou o pagamento.
export function cancelRechargeOrder(id) {
  return api.post(`/stores/credits/orders/${id}/cancel`, {}, { auth: true });
}

// GET /stores/credits/transactions — extrato do saldo comprado.
export function listCreditTransactions(page = 1) {
  return api.get(`/stores/credits/transactions?page=${page}&limit=10`, { auth: true });
}
