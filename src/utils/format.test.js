import { describe, it, expect } from 'vitest';
import { formatDateTime, formatCurrency } from './format';

describe('formatDateTime', () => {
  it('formata uma data ISO como dd/mm hh:mm em pt-BR', () => {
    const result = formatDateTime('2026-08-20T10:05:00.000Z');
    expect(result).toMatch(/^\d{2}\/\d{2}, \d{2}:\d{2}$/);
  });

  it('retorna um traço quando o valor é nulo ou vazio', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('')).toBe('—');
  });
});

describe('formatCurrency', () => {
  it('formata um número como moeda BRL', () => {
    expect(formatCurrency(8.5)).toContain('8,50');
  });

  it('retorna um traço quando o valor é null ou undefined', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('formata zero normalmente (não confunde com valor ausente)', () => {
    expect(formatCurrency(0)).toContain('0,00');
  });
});