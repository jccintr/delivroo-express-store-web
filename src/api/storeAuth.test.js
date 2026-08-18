import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerStore,
  loginStore,
  fetchCurrentStore,
  verifyAccount,
  resendAccountVerification,
  requestPasswordCode,
  verifyPasswordCode,
  resetPassword,
  updateStoreProfile,
  uploadStoreAvatar,
} from './storeAuth';
import { setToken } from './client';

function mockJsonResponse(data, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: { get: () => 'application/json' },
    json: async () => data,
  };
}

describe('storeAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('registerStore', () => {
    it('POST /stores/register com o payload', async () => {
      const body = {
        name: 'Pizzaria',
        email: 'loja@test.com',
        password: '123456',
        phone: '11999999999',
      };
      const response = {
        message: 'Conta criada com sucesso.',
        store: { _id: '1', ...body },
      };

      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockJsonResponse(response, { status: 201 }));

      const data = await registerStore(body);

      expect(data.message).toBe('Conta criada com sucesso.');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/stores/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        }),
      );
    });
  });

  describe('loginStore', () => {
    it('POST /stores/login e retorna token', async () => {
      const response = {
        _id: '1',
        name: 'Pizzaria',
        email: 'loja@test.com',
        token: 'jwt-token',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonResponse(response));

      const data = await loginStore({
        email: 'loja@test.com',
        password: '123456',
      });

      expect(data.token).toBe('jwt-token');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/login'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('propaga erro da API (credenciais inválidas)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonResponse({ error: 'Email ou senha inválidos.' }, { ok: false, status: 400 }),
      );

      await expect(
        loginStore({ email: 'a@a.com', password: 'x' }),
      ).rejects.toMatchObject({
        message: 'Email ou senha inválidos.',
        status: 400,
      });
    });
  });

  describe('fetchCurrentStore', () => {
    it('GET /stores/me com Authorization', async () => {
      setToken('meu-jwt');
      const store = {
        _id: '1',
        name: 'Pizzaria',
        email: 'loja@test.com',
        active: true,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonResponse(store));

      const data = await fetchCurrentStore();

      expect(data.name).toBe('Pizzaria');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/me'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer meu-jwt',
          }),
        }),
      );
    });
  });

  describe('verifyAccount', () => {
    it('POST /stores/verify-account com code e auth', async () => {
      setToken('meu-jwt');
      const store = {
        _id: '1',
        email: 'loja@test.com',
        emailVerifiedAt: '2026-08-02T20:15:00.000Z',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonResponse(store));

      const data = await verifyAccount('5048');

      expect(data.emailVerifiedAt).toBeTruthy();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/verify-account'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: '5048' }),
          headers: expect.objectContaining({
            Authorization: 'Bearer meu-jwt',
          }),
        }),
      );
    });
  });

  describe('resendAccountVerification', () => {
    it('POST /stores/verify-account/resend autenticado', async () => {
      setToken('meu-jwt');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonResponse({ message: 'Código de verificação reenviado.' }),
      );

      const data = await resendAccountVerification();

      expect(data.message).toMatch(/reenviado/i);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/verify-account/resend'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer meu-jwt',
          }),
        }),
      );
    });
  });

  describe('requestPasswordCode', () => {
    it('POST /stores/password/request com email', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonResponse({
          message:
            'Se este e-mail estiver cadastrado, enviaremos um código de verificação.',
        }),
      );

      const data = await requestPasswordCode('loja@test.com');

      expect(data.message).toBeTruthy();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/password/request'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'loja@test.com' }),
        }),
      );
    });
  });

  describe('verifyPasswordCode', () => {
    it('POST /stores/password/verify-code', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonResponse({ message: 'Código verificado com sucesso.' }),
      );

      const data = await verifyPasswordCode('loja@test.com', '5048');

      expect(data.message).toMatch(/sucesso/i);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/password/verify-code'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'loja@test.com', code: '5048' }),
        }),
      );
    });
  });

  describe('resetPassword', () => {
    it('POST /stores/password/reset', async () => {
      const payload = {
        email: 'loja@test.com',
        code: '5048',
        password: 'novaSenha123',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonResponse({ message: 'Senha redefinida com sucesso.' }),
      );

      const data = await resetPassword(payload);

      expect(data.message).toMatch(/redefinida/i);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/password/reset'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
    });
  });

  describe('updateStoreProfile', () => {
    it('PATCH /stores/me com auth e body parcial', async () => {
      setToken('meu-jwt');
      const payload = {
        name: 'Pizzaria Atualizada',
        address: { city: 'São Paulo', state: 'SP' },
      };
      const store = {
        _id: '1',
        name: payload.name,
        email: 'loja@test.com',
        address: payload.address,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonResponse(store));

      const data = await updateStoreProfile(payload);

      expect(data.name).toBe('Pizzaria Atualizada');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/me'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: expect.objectContaining({
            Authorization: 'Bearer meu-jwt',
          }),
        }),
      );
    });
  });

  describe('uploadStoreAvatar', () => {
    it('PATCH FormData em /stores/me/avatar com auth', async () => {
      setToken('meu-jwt');
      const file = new File(['fake'], 'avatar.png', { type: 'image/png' });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonResponse({
          message: 'Avatar atualizado com sucesso.',
          avatar: 'https://cdn.example.com/avatar.png',
        }),
      );

      const data = await uploadStoreAvatar(file);

      expect(data.avatar).toContain('https://');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stores/me/avatar'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer meu-jwt',
          }),
        }),
      );

      const [, options] = fetch.mock.calls[0];
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.headers['Content-Type']).toBeUndefined();
    });
  });
});