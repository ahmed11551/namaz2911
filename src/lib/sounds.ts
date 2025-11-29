// Звуковые эффекты для приложения

// Типы звуков
export type SoundType = 
  | "click" 
  | "success" 
  | "tasbih" 
  | "complete" 
  | "notification"
  | "levelUp"
  | "badge";

// Частоты для разных звуков (Web Audio API)
const SOUND_FREQUENCIES: Record<SoundType, number[]> = {
  click: [800],
  success: [523, 659, 784],
  tasbih: [440],
  complete: [523, 659, 784, 1047],
  notification: [880, 1108],
  levelUp: [262, 330, 392, 523, 659, 784],
  badge: [523, 784, 1047],
};

// Длительности нот
const SOUND_DURATIONS: Record<SoundType, number> = {
  click: 50,
  success: 150,
  tasbih: 80,
  complete: 200,
  notification: 100,
  levelUp: 100,
  badge: 150,
};

// Настройки звуков
let soundEnabled = true;
let audioContext: AudioContext | null = null;

// Инициализация аудио контекста
const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
      return null;
    }
  }
  return audioContext;
};

// Воспроизведение ноты
const playNote = (frequency: number, duration: number, startTime: number, ctx: AudioContext) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  
  // Envelope
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration / 1000);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000);
};

// Основная функция воспроизведения звука
export const playSound = (type: SoundType): void => {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Убедимся, что контекст активен
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  
  const frequencies = SOUND_FREQUENCIES[type];
  const duration = SOUND_DURATIONS[type];
  const now = ctx.currentTime;
  
  frequencies.forEach((freq, i) => {
    playNote(freq, duration, now + i * (duration / 1000 * 0.8), ctx);
  });
};

// Управление звуками
export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
  localStorage.setItem("sound_enabled", String(enabled));
};

export const getSoundEnabled = (): boolean => {
  const saved = localStorage.getItem("sound_enabled");
  if (saved !== null) {
    soundEnabled = saved === "true";
  }
  return soundEnabled;
};

// Хук для вибрации (для мобильных)
export const vibrate = (pattern: number | number[] = 50): void => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// Комбинированный эффект (звук + вибрация)
export const hapticFeedback = (type: SoundType): void => {
  playSound(type);
  
  // Разные паттерны вибрации для разных звуков
  switch (type) {
    case "click":
      vibrate(10);
      break;
    case "tasbih":
      vibrate(20);
      break;
    case "success":
    case "complete":
      vibrate([50, 50, 100]);
      break;
    case "levelUp":
    case "badge":
      vibrate([100, 50, 100, 50, 100]);
      break;
    default:
      vibrate(30);
  }
};

