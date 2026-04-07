let audioContext: AudioContext | null = null;
let unlockListenersAttached = false;
let repeatingAlertTimer: ReturnType<typeof setInterval> | null = null;
const repeatingAlertSources = new Set<string>();
const REPEATING_ALERT_INTERVAL_MS = 1600;

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
  if (!AudioContextCtor) {
    return "unsupported";
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
    const context = await resumeAudioContext();
    if (!context || context.state !== "running") {
      return;
    }

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
