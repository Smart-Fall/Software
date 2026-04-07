let audioContext: AudioContext | null = null;
let unlockListenersAttached = false;
let repeatingAlertTimer: ReturnType<typeof setInterval> | null = null;
const repeatingAlertSources = new Set<string>();
const REPEATING_ALERT_INTERVAL_MS = 1600;
let fallbackAudioUrl: string | null = null;
const PUBLIC_FALL_ALERT_AUDIO_URL = "/mixkit-confirmation-tone-2867.wav";

export type FallAlertAudioStatus = "ready" | "blocked" | "unsupported";

function getAudioContextCtor() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

function hasAudioElementSupport() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function hasUserGestureForAudio() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithActivation = navigator as Navigator & {
    userActivation?: { hasBeenActive: boolean; isActive: boolean };
  };

  return Boolean(
    navigatorWithActivation.userActivation?.hasBeenActive ||
      navigatorWithActivation.userActivation?.isActive,
  );
}

function createFallAlertWavBlob() {
  const sampleRate = 44100;
  const pattern = [880, 660, 880];
  const noteDuration = 0.12;
  const noteGap = 0.06;
  const attackSamples = Math.floor(sampleRate * 0.01);
  const releaseSamples = Math.floor(sampleRate * 0.03);
  const totalDuration =
    pattern.length * noteDuration + (pattern.length - 1) * noteGap;
  const totalSamples = Math.floor(sampleRate * totalDuration);
  const pcm = new Int16Array(totalSamples);

  let cursor = 0;
  pattern.forEach((frequency, index) => {
    const noteSamples = Math.floor(sampleRate * noteDuration);
    const gapSamples = index === pattern.length - 1
      ? 0
      : Math.floor(sampleRate * noteGap);

    for (let sampleIndex = 0; sampleIndex < noteSamples; sampleIndex++) {
      const time = sampleIndex / sampleRate;
      const attackEnvelope = attackSamples > 0
        ? Math.min(1, sampleIndex / attackSamples)
        : 1;
      const releaseEnvelope = releaseSamples > 0
        ? Math.min(1, (noteSamples - sampleIndex) / releaseSamples)
        : 1;
      const envelope = Math.min(attackEnvelope, releaseEnvelope);
      const value = Math.sin(2 * Math.PI * frequency * time) * 0.28 * envelope;
      pcm[cursor + sampleIndex] = Math.max(
        -32767,
        Math.min(32767, Math.round(value * 32767)),
      );
    }

    cursor += noteSamples + gapSamples;
  });

  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index++) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, pcm.length * 2, true);

  for (let index = 0; index < pcm.length; index++) {
    view.setInt16(44 + index * 2, pcm[index], true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function getFallbackAudioUrl() {
  if (!fallbackAudioUrl) {
    fallbackAudioUrl = URL.createObjectURL(createFallAlertWavBlob());
  }
  return fallbackAudioUrl;
}

async function playFallAlertAudioFile() {
  if (!hasAudioElementSupport() || !hasUserGestureForAudio()) {
    return false;
  }

  const sources = [PUBLIC_FALL_ALERT_AUDIO_URL, getFallbackAudioUrl()];

  try {
    for (const source of sources) {
      const audio = new Audio(source);
      audio.preload = "auto";

      try {
        await audio.play();
        return true;
      } catch {
        // Try the next source.
      }
    }

    return false;
  } catch {
    return false;
  }
}

function getAudioContext(): AudioContext | null {
  const AudioContextCtor = getAudioContextCtor();
  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContext) {
    if (!hasUserGestureForAudio()) {
      return null;
    }
    audioContext = new AudioContextCtor();
  }

  return audioContext;
}

async function resumeAudioContext() {
  const context = getAudioContext();
  if (!context) {
    return null;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return context;
    }
  }

  return context;
}

export async function getFallAlertAudioStatus(): Promise<FallAlertAudioStatus> {
  const AudioContextCtor = getAudioContextCtor();
  if (!AudioContextCtor && !hasAudioElementSupport()) {
    return "unsupported";
  }

  if (hasAudioElementSupport() && hasUserGestureForAudio()) {
    return "ready";
  }

  if (audioContext?.state === "running") {
    return "ready";
  }

  if (!hasUserGestureForAudio()) {
    return "blocked";
  }

  const context = getAudioContext();
  if (!context) {
    return "blocked";
  }

  const resumedContext = await resumeAudioContext();
  if (resumedContext?.state === "running") {
    return "ready";
  }

  return "blocked";
}

export function primeFallAlertAudio() {
  if (typeof window === "undefined" || unlockListenersAttached) {
    return;
  }

  const unlockAudio = async () => {
    if (!hasUserGestureForAudio()) {
      return;
    }

    void resumeAudioContext();

    updateRepeatingAlertLoop();

    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
    unlockListenersAttached = false;
  };

  unlockListenersAttached = true;
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
}

export async function playFallAlertSound() {
  if (await playFallAlertAudioFile()) {
    return true;
  }

  const context = await resumeAudioContext();
  if (!context || context.state !== "running") {
    return false;
  }

  const pattern = [880, 660, 880];
  const noteDuration = 0.12;
  const noteGap = 0.06;
  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(0.0001, context.currentTime);
  masterGain.connect(context.destination);

  pattern.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const start = context.currentTime + index * (noteDuration + noteGap);
    const end = start + noteDuration;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);

    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  });

  const totalDuration =
    pattern.length * noteDuration + (pattern.length - 1) * noteGap;
  masterGain.gain.exponentialRampToValueAtTime(
    0.0001,
    context.currentTime + totalDuration + 0.05,
  );

  return true;
}

function updateRepeatingAlertLoop() {
  if (repeatingAlertSources.size === 0) {
    if (repeatingAlertTimer) {
      clearInterval(repeatingAlertTimer);
      repeatingAlertTimer = null;
    }
    return;
  }

  if (repeatingAlertTimer) {
    return;
  }

  void playFallAlertSound().then((played) => {
    if (!played || repeatingAlertSources.size === 0 || repeatingAlertTimer) {
      return;
    }

    repeatingAlertTimer = setInterval(() => {
      void playFallAlertSound();
    }, REPEATING_ALERT_INTERVAL_MS);
  });
}

export function startRepeatingFallAlert(sourceId: string) {
  repeatingAlertSources.add(sourceId);
  updateRepeatingAlertLoop();
}

export function stopRepeatingFallAlert(sourceId: string) {
  repeatingAlertSources.delete(sourceId);
  updateRepeatingAlertLoop();
}

export function clearAllRepeatingFallAlerts() {
  repeatingAlertSources.clear();
  updateRepeatingAlertLoop();
}
