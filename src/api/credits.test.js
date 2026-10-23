import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  api: { get: vi.fn(), post: vi.fn(), postForm: vi.fn() },
}));

import { api } from './client';
import { createRechargeOrder, informPayment } from './credits';

describe('api/credits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createRechargeOrder envia o packageId', () => {
    createRechargeOrder('p1');
    expect(api.post).toHaveBeenCalledWith('/stores/credits/orders', { packageId: 'p1' }, { auth: true });
  });

  it('informPayment monta FormData só com o que foi informado', () => {
    const file = new File(['x'], 'r.png', { type: 'image/png' });
    informPayment('o1', { payerNote: 'oi', receipt: file });
    const [path, form] = api.postForm.mock.calls[0];
    expect(path).toBe('/stores/credits/orders/o1/inform');
    expect(form.get('payerNote')).toBe('oi');
    expect(form.get('receipt')).toBeInstanceOf(File);

    informPayment('o2');
    const empty = api.postForm.mock.calls[1][1];
    expect([...empty.keys()]).toEqual([]);
  });
});
