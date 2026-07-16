let audioContext = null;
let soundEnabled = false;

function getAudioContext() {
  if (audioContext || typeof window === 'undefined') return audioContext;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  audioContext = new AudioContextClass();
  return audioContext;
}

export async function enableNotificationSound() {
  const context = getAudioContext();
  if (!context) return;

  try {
    if (context.state === 'suspended') await context.resume();
    soundEnabled = context.state === 'running';
  } catch {
    soundEnabled = false;
  }
}

function scheduleTone(context, destination, frequency, start, duration, volume) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playNotificationSound() {
  const context = getAudioContext();
  if (!soundEnabled || !context || context.state !== 'running') return;

  const master = context.createGain();
  master.gain.setValueAtTime(0.5, context.currentTime);
  master.connect(context.destination);

  const start = context.currentTime + 0.01;
  scheduleTone(context, master, 1046.5, start, 0.34, 0.2);
  scheduleTone(context, master, 1568, start + 0.075, 0.42, 0.14);
}
