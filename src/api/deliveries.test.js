import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDelivery, listStoreActiveDeliveries, cancelStoreDelivery } from './deliveries';
import { setToken } from './client';

function mockJsonResponse(data, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => data,
  };
}

describe('deliveries api', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('createDelivery', () => {
    it('POST /stores/deliveries com o payload e Authorization Bearer', async () => {
      setToken('meu-jwt');
      const payload = {
        destino: { nome: 'Maria', telefone: '35999999999', address: 'Rua X, 1' },
        package: { description: '2 marmitas' },
      };
      const response = { _id: '1', status: 0, ...payload };

      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockJsonResponse(response, { status: 201 }));

      const data = await createDelivery(payload);

      expect(data.status).toBe(0);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/stores/deliveries'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer meu-jwt' }),
        }),
      );
    });
  });

  describe('listStoreActiveDeliveries', () => {
    it('GET /stores/deliveries/active com Authorization Bearer', async () => {
      setToken('meu-jwt');
      const response = [
        { _id: '1', status: 0, destino: { nome: 'Maria' } },
        { _id: '2', status: 3, destino: { nome: 'João' } },
      ];

      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockJsonResponse(response));

      const data = await listStoreActiveDeliveries();

      expect(data).toHaveLength(2);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/stores/deliveries/active'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer meu-jwt' }),
        }),
      );
    });

    it('propaga o erro da API como ApiError', async () => {
      setToken('meu-jwt');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonResponse({ error: 'Conta ainda não verificada.' }, { ok: false, status: 403 }),
      );

      await expect(listStoreActiveDeliveries()).rejects.toMatchObject({
        message: 'Conta ainda não verificada.',
        status: 403,
      });
    });
  });

  describe('cancelStoreDelivery', () => {
    it('POST /stores/deliveries/:id/cancel com o motivo e Authorization Bearer', async () => {
      setToken('meu-jwt');
      const response = { _id: 'd1', status: 6, cancelReason: 'Cliente desistiu da compra' };

      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockJsonResponse(response));

      const data = await cancelStoreDelivery('d1', 'Cliente desistiu da compra');

      expect(data.status).toBe(6);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/stores/deliveries/d1/cancel'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer meu-jwt' }),
          body: JSON.stringify({ motivo: 'Cliente desistiu da compra' }),
        }),
      );
    });

    it('propaga o erro da API (ex: pacote já retirado) como ApiError', async () => {
      setToken('meu-jwt');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonResponse({ error: 'Não foi possível cancelar esta entrega.' }, { ok: false, status: 409 }),
      );

      await expect(cancelStoreDelivery('d1', 'motivo qualquer')).rejects.toMatchObject({
        message: 'Não foi possível cancelar esta entrega.',
        status: 409,
      });
    });
  });
});