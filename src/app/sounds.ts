import { readValue } from './storage/kv';

/**
 * The table's little sounds: paper, cloth, marble, metal. Every event has
 * several recordings; one is picked at random (never the one that played
 * last) and nudged a little in volume and pitch, so nothing sounds like the
 * same file twice. Everything is quiet on purpose: it is the felt of the
 * table, not music.
 */
export type SoundEvent =
  | 'turn'
  | 'place'
  | 'flap'
  | 'undo'
  | 'check'
  | 'crumple'
  | 'cloth'
  | 'rustle'
  | 'binland'
  | 'spike'
  | 'stamp'
  | 'pin'
  | 'toggle'
  | 'tick'
  | 'tear'
  | 'marble';

interface SoundOptions {
  /** Multiplier on the event's own loudness. */
  volume?: number;
  /** Wait this long (ms) before it starts. */
  delayMs?: number;
}

// The loudness of each event on its own, before the +-10% nudge.
const BASE_VOLUME: Record<SoundEvent, number> = {
  turn: 0.5,
  place: 0.4,
  flap: 0.5,
  undo: 0.5,
  check: 0.45,
  crumple: 0.7,
  cloth: 0.35,
  rustle: 0.35,
  binland: 0.7,
  spike: 0.45,
  stamp: 0.7,
  pin: 0.5,
  toggle: 0.5,
  tick: 0.35,
  tear: 0.8,
  marble: 0.6,
};

// Events that can come in quick bursts get a minimum gap (ms).
const MIN_GAP_MS: Partial<Record<SoundEvent, number>> = {
  turn: 70,
  cloth: 140,
  tick: 90,
  check: 60,
};

const SETTINGS_KEY = 'card-tracker.settings.v1';

const files = import.meta.glob('../assets/sounds/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const variants = new Map<SoundEvent, string[]>();

for (const [path, url] of Object.entries(files).sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  const match = /\/([a-z]+)-\d+\.mp3$/.exec(path);

  if (match) {
    const event = match[1] as SoundEvent;
    variants.set(event, [...(variants.get(event) ?? []), url]);
  }
}

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer | null>>();
const lastIndex = new Map<SoundEvent, number>();
const lastPlayedAt = new Map<SoundEvent, number>();

const isSoundEnabled = (): boolean =>
  readValue<Record<string, boolean>>(SETTINGS_KEY)?.sounds ?? true;

const getContext = (): AudioContext | null => {
  if (context) {
    return context;
  }

  const Constructor: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;

  if (!Constructor) {
    return null;
  }

  try {
    context = new Constructor();
  } catch {
    context = null;
  }

  return context;
};

const loadBuffer = (url: string): Promise<AudioBuffer | null> => {
  const cached = buffers.get(url);

  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = loading.get(url);

  if (pending) {
    return pending;
  }

  const audio = getContext();

  if (!audio) {
    return Promise.resolve(null);
  }

  const request = fetch(url)
    .then((response) => response.arrayBuffer())
    .then((data) => audio.decodeAudioData(data))
    .then((buffer) => {
      buffers.set(url, buffer);
      return buffer;
    })
    .catch(() => null)
    .finally(() => loading.delete(url));

  loading.set(url, request);
  return request;
};

const startSound = (
  event: SoundEvent,
  buffer: AudioBuffer,
  options: SoundOptions,
) => {
  const audio = context;

  if (!audio) {
    return;
  }

  const source = audio.createBufferSource();
  const gain = audio.createGain();

  source.buffer = buffer;
  source.playbackRate.value = 0.96 + Math.random() * 0.08;
  gain.gain.value =
    BASE_VOLUME[event] * (options.volume ?? 1) * (0.9 + Math.random() * 0.2);
  source.connect(gain);
  gain.connect(audio.destination);
  source.start(audio.currentTime + (options.delayMs ?? 0) / 1000);
};

/** Plays one of the event's recordings, if sounds are on. */
export const playSound = (
  event: SoundEvent,
  options: SoundOptions = {},
): void => {
  if (!isSoundEnabled()) {
    return;
  }

  const options_ = variants.get(event);

  if (!options_ || options_.length === 0) {
    return;
  }

  const now = performance.now();
  const gap = MIN_GAP_MS[event] ?? 0;

  if (now - (lastPlayedAt.get(event) ?? -Infinity) < gap) {
    return;
  }

  const audio = getContext();

  if (!audio) {
    return;
  }

  if (audio.state === 'suspended') {
    void audio.resume().catch(() => undefined);
  }

  // Random, but never the same one twice in a row.
  const previous = lastIndex.get(event) ?? -1;
  let index = Math.floor(Math.random() * options_.length);

  if (options_.length > 1 && index === previous) {
    index = (index + 1 + Math.floor(Math.random() * (options_.length - 1))) % options_.length;
  }

  lastIndex.set(event, index);
  lastPlayedAt.set(event, now);

  const url = options_[index]!;

  void loadBuffer(url).then((buffer) => {
    if (buffer) {
      startSound(event, buffer, options);
    }
  });
};

const loadAll = () => {
  for (const urls of variants.values()) {
    for (const url of urls) {
      void loadBuffer(url);
    }
  }
};

// Browsers let sound start only after the person has touched the page: the
// first touch wakes the audio.
//
// The audio context is made, and the recordings (about 200 KB) fetched and
// decoded, while the page is idle after it has loaded: making a context on a
// first press cost hundreds of milliseconds there, in the middle of a tear.
// The context starts suspended and is only resumed by the first touch.
if (typeof window !== 'undefined') {
  const warmUp = () => {
    if (!isSoundEnabled() || !getContext()) {
      return;
    }

    loadAll();
  };

  const scheduleWarmUp = () => {
    const idle = (
      window as unknown as {
        requestIdleCallback?: (
          callback: () => void,
          options?: { timeout: number },
        ) => number;
      }
    ).requestIdleCallback;

    if (idle) {
      idle.call(window, warmUp, { timeout: 4000 });
    } else {
      window.setTimeout(warmUp, 1500);
    }
  };

  if (document.readyState === 'complete') {
    scheduleWarmUp();
  } else {
    window.addEventListener('load', scheduleWarmUp, { once: true });
  }

  const unlock = () => {
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);

    const audio = getContext();

    if (!audio) {
      return;
    }

    void audio.resume().catch(() => undefined);
    loadAll();
  };

  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}
