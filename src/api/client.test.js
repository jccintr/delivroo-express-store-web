import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getToken, setToken, api, ApiError } from './client';

describe('client token helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setToken grava e getToken lê o token', () => {
    expect(getToken()).toBeNull();

    setToken('abc123');
    expect(getToken()).toBe('abc123');
    expect(localStorage.getItem('delivroo_store_token')).toBe('abc123');
  });

  it('setToken(null) remove o token', () => {
    setToken('abc123');
    setToken(null);
    expect(getToken()).toBeNull();
  });
});

describe('api.post login', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('em sucesso retorna o JSON da API', async () => {
    const payload = {
      _id: '1',
      name: 'Pizzaria',
      email: 'loja@test.com',
      token: 'jwt-token',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    });

    const data = await api.post('/stores/login', {
      email: 'loja@test.com',
      password: '123456',
    });

    expect(data.token).toBe('jwt-token');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/stores/login'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('em erro lança ApiError com status e mensagem', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Email ou senha inválidos.' }),
    });

    await expect(
      api.post('/stores/login', { email: 'a@a.com', password: 'x' }),
    ).rejects.toMatchObject({
      message: 'Email ou senha inválidos.',
      status: 400,
    });

    await expect(
      api.post('/stores/login', { email: 'a@a.com', password: 'x' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('com auth: true envia Authorization Bearer', async () => {
    setToken('meu-jwt');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ name: 'Loja' }),
    });

    await api.get('/stores/me', { auth: true });

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