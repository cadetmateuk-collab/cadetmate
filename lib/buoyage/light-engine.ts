import type { LightColour, LightSegment } from '@/types/buoyage';
import {
  lightStateAt,
  lightPhaseOffsetSec,
  sequencePeriod,
} from '@/data/buoyage/light-patterns';

export type LightSample = { on: boolean; intensity: number; colour?: LightColour };

type LightNode = {
  el: Element & { style: CSSStyleDeclaration };
  sequence: LightSegment[];
  colour: string;
  /** Seconds added to the shared clock so marks don't flash in sync */
  phaseSec: number;
};

const COLOUR_GLOW: Record<string, string> = {
  red: 'rgba(255, 60, 60, 0.95)',
  green: 'rgba(40, 220, 100, 0.95)',
  white: 'rgba(255, 255, 255, 0.95)',
  yellow: 'rgba(255, 220, 60, 0.95)',
  blue: 'rgba(80, 160, 255, 0.95)',
  none: 'transparent',
};

const COLOUR_FILL: Record<string, string> = {
  red: '#FF4D4D',
  green: '#3DFF8A',
  white: '#FFFFFF',
  yellow: '#FFE066',
  blue: '#66B3FF',
  none: 'transparent',
};

let nodes = new Map<string, LightNode>();
let rafId: number | null = null;
let started = false;

function applyFill(el: Element, colour: string) {
  const fill = COLOUR_FILL[colour] ?? COLOUR_FILL.white;
  el.querySelectorAll('circle').forEach((c) => {
    c.setAttribute('fill', fill);
  });
}

function tick(now: number) {
  const tSec = now / 1000;
  for (const node of nodes.values()) {
    const state = lightStateAt(node.sequence, tSec + node.phaseSec);
    const intensity = state.on ? 1 : 0;
    node.el.style.opacity = String(intensity);
    if (state.on) {
      const colour = state.colour ?? node.colour;
      const glow = COLOUR_GLOW[colour] ?? COLOUR_GLOW.white;
      node.el.style.filter = `drop-shadow(0 0 6px ${glow}) drop-shadow(0 0 14px ${glow})`;
      applyFill(node.el, colour);
    } else {
      node.el.style.filter = 'none';
    }
  }
  rafId = requestAnimationFrame(tick);
}

function ensureRunning() {
  if (started) return;
  started = true;
  rafId = requestAnimationFrame(tick);
}

function stopIfEmpty() {
  if (nodes.size === 0 && rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
    started = false;
  }
}

/** Register a light DOM node for the shared animation clock. */
export function registerLight(
  id: string,
  el: (Element & { style: CSSStyleDeclaration }) | null,
  sequence: LightSegment[],
  colour: string,
) {
  if (!el) {
    unregisterLight(id);
    return;
  }
  const phaseSec = lightPhaseOffsetSec(id, sequencePeriod(sequence));
  nodes.set(id, { el, sequence, colour, phaseSec });
  el.style.willChange = 'opacity, filter';
  el.style.transition = 'none';
  ensureRunning();
}

export function unregisterLight(id: string) {
  nodes.delete(id);
  stopIfEmpty();
}

export function updateLightSequence(
  id: string,
  sequence: LightSegment[],
  colour?: string,
) {
  const node = nodes.get(id);
  if (!node) return;
  node.sequence = sequence;
  node.phaseSec = lightPhaseOffsetSec(id, sequencePeriod(sequence));
  if (colour) node.colour = colour;
}

/** Utility for tests / one-shot evaluation */
export function playLightPattern(opts: {
  sequence: LightSegment[];
  timeSec: number;
  markId?: string;
}): LightSample {
  const t =
    opts.markId != null
      ? opts.timeSec + lightPhaseOffsetSec(opts.markId, sequencePeriod(opts.sequence))
      : opts.timeSec;
  const state = lightStateAt(opts.sequence, t);
  return { on: state.on, intensity: state.on ? 1 : 0, colour: state.colour };
}

export function getPatternPeriod(sequence: LightSegment[]): number {
  return sequencePeriod(sequence);
}
