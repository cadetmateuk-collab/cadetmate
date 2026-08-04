import type { LightSegment } from '@/types/buoyage';

/** Morse unit durations (seconds) for Mo patterns */
const MORSE_DOT = 0.3;
const MORSE_DASH = 0.9;
const MORSE_GAP = 0.3;
const MORSE_LETTER_GAP = 0.9;

const MORSE_CODE: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
};

export function sequencePeriod(sequence: LightSegment[]): number {
  return sequence.reduce((sum, s) => sum + s.duration, 0);
}

/** Fixed light — always on */
export function fixed(): LightSegment[] {
  return [{ on: true, duration: 1 }];
}

/** Isophase — equal light and dark */
export function isophase(periodSec: number): LightSegment[] {
  const half = periodSec / 2;
  return [
    { on: true, duration: half },
    { on: false, duration: half },
  ];
}

/** Occulting — mostly on with short darkness */
export function occulting(periodSec: number, darkRatio = 0.25): LightSegment[] {
  const dark = periodSec * darkRatio;
  return [
    { on: true, duration: periodSec - dark },
    { on: false, duration: dark },
  ];
}

/** Single flash */
export function flashing(periodSec: number, flashSec = 0.3): LightSegment[] {
  return [
    { on: true, duration: flashSec },
    { on: false, duration: Math.max(0.05, periodSec - flashSec) },
  ];
}

/** Long flash */
export function longFlash(periodSec: number, flashSec = 2): LightSegment[] {
  return [
    { on: true, duration: flashSec },
    { on: false, duration: Math.max(0.05, periodSec - flashSec) },
  ];
}

/**
 * Group flash Fl(n) or composite Fl(n+m).
 * flashSec / gapSec between flashes in a group; longGap after the group fills the period.
 */
export function groupFlash(
  counts: number[],
  periodSec: number,
  flashSec = 0.3,
  gapSec = 0.3,
): LightSegment[] {
  const sequence: LightSegment[] = [];
  let used = 0;

  for (let g = 0; g < counts.length; g++) {
    const n = counts[g];
    for (let i = 0; i < n; i++) {
      sequence.push({ on: true, duration: flashSec });
      used += flashSec;
      if (i < n - 1) {
        sequence.push({ on: false, duration: gapSec });
        used += gapSec;
      }
    }
    if (g < counts.length - 1) {
      // Short pause between composite groups
      const between = gapSec * 2;
      sequence.push({ on: false, duration: between });
      used += between;
    }
  }

  const remainder = Math.max(0.1, periodSec - used);
  sequence.push({ on: false, duration: remainder });
  return sequence;
}

/** Quick / Very Quick / Ultra Quick continuous flashing */
export function quickFlash(ratePerMinute: number): LightSegment[] {
  const period = 60 / ratePerMinute;
  const on = period * 0.4;
  return [
    { on: true, duration: on },
    { on: false, duration: period - on },
  ];
}

/** Group quick flash Q(n) / VQ(n) */
export function groupQuickFlash(
  count: number,
  periodSec: number,
  ratePerMinute: number,
): LightSegment[] {
  const flashPeriod = 60 / ratePerMinute;
  const flashOn = flashPeriod * 0.4;
  const flashOff = flashPeriod - flashOn;
  return groupFlash(
    [count],
    periodSec,
    flashOn,
    flashOff,
  );
}

export function morse(letters: string, periodSec?: number): LightSegment[] {
  const sequence: LightSegment[] = [];
  const upper = letters.toUpperCase().replace(/[^A-Z0-9]/g, '');

  for (let li = 0; li < upper.length; li++) {
    const code = MORSE_CODE[upper[li]] ?? '';
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      sequence.push({
        on: true,
        duration: ch === '.' ? MORSE_DOT : MORSE_DASH,
      });
      if (i < code.length - 1) {
        sequence.push({ on: false, duration: MORSE_GAP });
      }
    }
    if (li < upper.length - 1) {
      sequence.push({ on: false, duration: MORSE_LETTER_GAP });
    }
  }

  const used = sequencePeriod(sequence);
  const total = periodSec ?? Math.max(used + 2, used * 1.5);
  sequence.push({ on: false, duration: Math.max(0.5, total - used) });
  return sequence;
}

/**
 * Parse common IALA characteristic strings into sequences.
 * Examples: "F", "Fl 5s", "Fl(2) 5s", "Fl(2+1) 10s", "Q", "VQ(3) 5s", "Iso 2s", "Oc 4s", "LFl 10s", "Mo(A) 8s"
 */
export function parseCharacteristic(
  characteristic: string,
  periodSec?: number,
): LightSegment[] {
  const raw = characteristic.trim();
  const periodMatch = raw.match(/(\d+(?:\.\d+)?)\s*s/i);
  const period = periodSec ?? (periodMatch ? parseFloat(periodMatch[1]) : 5);

  if (/^F\b/i.test(raw) && !/^Fl/i.test(raw)) return fixed();
  if (/^Iso/i.test(raw)) return isophase(period);
  if (/^Oc/i.test(raw)) return occulting(period);
  if (/^LFl/i.test(raw)) return longFlash(period);
  if (/^Mo\(([A-Z0-9]+)\)/i.test(raw)) {
    const letter = raw.match(/Mo\(([A-Z0-9]+)\)/i)?.[1] ?? 'A';
    return morse(letter, period);
  }

  // Composite / group flash: Fl(2+1), Fl(3)
  const flGroup = raw.match(/^Fl\((\d+(?:\+\d+)*)\)/i);
  if (flGroup) {
    const counts = flGroup[1].split('+').map((n) => parseInt(n, 10));
    return groupFlash(counts, period);
  }

  if (/^Fl\b/i.test(raw)) return flashing(period);

  // VQ(3), Q(3), UQ
  const vqGroup = raw.match(/^VQ\((\d+)\)/i);
  if (vqGroup) return groupQuickFlash(parseInt(vqGroup[1], 10), period, 120);

  const qGroup = raw.match(/^Q\((\d+)\)/i);
  if (qGroup) return groupQuickFlash(parseInt(qGroup[1], 10), period, 60);

  if (/^UQ\b/i.test(raw)) return quickFlash(240);
  if (/^VQ\b/i.test(raw)) return quickFlash(120);
  if (/^Q\b/i.test(raw)) return quickFlash(60);

  // Fallback: single flash
  return flashing(period);
}

export function isLightOnAt(sequence: LightSegment[], timeSec: number): boolean {
  const period = sequencePeriod(sequence);
  if (period <= 0) return false;
  let t = ((timeSec % period) + period) % period;
  for (const seg of sequence) {
    if (t < seg.duration) return seg.on;
    t -= seg.duration;
  }
  return false;
}

/**
 * Stable phase offset (seconds) for a mark so lights don't flash in lockstep.
 * Same id → same offset; different ids → spread across the pattern period.
 */
export function lightPhaseOffsetSec(markId: string, periodSec: number): number {
  if (periodSec <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < markId.length; i++) {
    h ^= markId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Mix in a second scramble so nearby ids (…1, …2) still differ a lot
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  const u = ((h >>> 0) % 10000) / 10000;
  return u * periodSec;
}

/** Evaluate light state with a per-mark phase offset applied. */
export function isMarkLightOnAt(
  sequence: LightSegment[],
  timeSec: number,
  markId: string,
): boolean {
  const period = sequencePeriod(sequence);
  return isLightOnAt(sequence, timeSec + lightPhaseOffsetSec(markId, period));
}
