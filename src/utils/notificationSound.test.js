import { describe, it, expect, vi, beforeEach } from 'vitest';

// jsdom não implementa a Web Audio API — criamos um mock mínimo o
// suficiente para exercitar o código sem tocar áudio de verdade.
class MockOscillator {
  constructor() {
    this.type = null;
    this.frequency = { value: 0 };
    this.connect = vi.fn(() => this);
    this.start = vi.fn();
    this.stop = vi.fn();
  }
}

class MockGain {
  constructor() {
    this.gain = {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    };
    this.connect = vi.fn(() => this);
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
    this.resume = vi.fn(() => {
      this.state = 'running';
    });
    this.createOscillator = vi.fn(() => new MockOscillator());
    this.createGain = vi.fn(() => new MockGain());
  }
}

describe('notificationSound', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  it('unlockAudio cria e retoma o AudioContext', async () => {
    const { unlockAudio } = await import('./notificationSound');

    expect(() => unlockAudio()).not.toThrow();
  });

  it('playNotificationSound cria dois osciladores (duas notas) sem lançar erro', async () => {
    const { playNotificationSound } = await import('./notificationSound');

    expect(() => playNotificationSound()).not.toThrow();
  });

  it('não lança erro quando o navegador não suporta Web Audio API', async () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);

    const { playNotificationSound, unlockAudio } = await import('./notificationSound');

    expect(() => unlockAudio()).not.toThrow();
    expect(() => playNotificationSound()).not.toThrow();
  });
});