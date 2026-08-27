// Toca um "ding" de notificação sem depender de nenhum arquivo de áudio —
// sintetizado na hora via Web Audio API. Isso evita ter que versionar um
// asset de som no repo e nos dá controle total sobre o som (duas notas
// curtas, tipo "novo evento").
let audioCtx = null;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  // Navegadores suspendem o AudioContext até haver um gesto do usuário na
  // página (clique, tecla). unlockAudio() cuida de retomá-lo cedo.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Chamar a partir de um gesto do usuário (ex: primeiro clique/tecla na
// página) para "destravar" o áudio antes do primeiro evento em tempo real
// chegar — senão o navegador bloqueia o primeiro play() silenciosamente.
export function unlockAudio() {
  getAudioContext();
}

// Duas notas curtas em sequência (880Hz -> 1320Hz), com fade-out suave.
export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  [880, 1320].forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.12;

    oscillator.type = 'sine';
    oscillator.frequency.value = freq;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.3);
  });
}