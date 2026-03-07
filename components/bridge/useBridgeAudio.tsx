'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { CameraNode } from './BridgeScene';

// ══════════════════════════════════════════════════════════════════════════════
//  useBridgeAudio — subtle, realistic ship bridge ambience
//
//  Layers (all very quiet and blended):
//   1. Engine hum      — deep 62 Hz rumble, barely audible, felt more than heard
//   2. Engine body     — 2nd/3rd harmonics to give it texture, very low
//   3. Ventilation     — soft broadband hiss, like background air conditioning
//   4. Sea ambient     — low frequency wash, changes with node position
//   5. Wind (wings)    — only present on psWing / sbWing, slow gust LFO
//   6. Occasional VHF  — very rare, very quiet squelch. No radar bleeps.
// ══════════════════════════════════════════════════════════════════════════════

interface NodeProfile {
  engine:      number;
  ventilation: number;
  sea:         number;
  wind:        number;   // only audible on wing positions
}

const NODE_PROFILES: Record<CameraNode, NodeProfile> = {
  back:       { engine: 1.0,  ventilation: 0.8,  sea: 0.25, wind: 0.0  },
  helm:       { engine: 0.85, ventilation: 1.0,  sea: 0.15, wind: 0.0  },
  psEcdis:    { engine: 0.8,  ventilation: 1.0,  sea: 0.15, wind: 0.0  },
  psLookout:  { engine: 0.7,  ventilation: 0.8,  sea: 0.3,  wind: 0.0  },
  psRadio:    { engine: 0.7,  ventilation: 0.9,  sea: 0.15, wind: 0.0  },
  psSofa:     { engine: 0.75, ventilation: 1.0,  sea: 0.1,  wind: 0.0  },
  sbDesk:     { engine: 0.8,  ventilation: 0.95, sea: 0.15, wind: 0.0  },
  sbLogbook:  { engine: 0.75, ventilation: 0.9,  sea: 0.15, wind: 0.0  },
  sbLookout:  { engine: 0.7,  ventilation: 0.8,  sea: 0.3,  wind: 0.0  },
  radar:      { engine: 0.8,  ventilation: 0.9,  sea: 0.2,  wind: 0.0  },
  psWing:     { engine: 0.2,  ventilation: 0.0,  sea: 0.7,  wind: 1.0  },
  sbWing:     { engine: 0.2,  ventilation: 0.0,  sea: 0.7,  wind: 1.0  },
};

// Master volume — keep everything very restrained
const MASTER_VOL = 0.28;

// Per-layer base gains (will be multiplied by profile values)
const BASE = {
  engine:      0.055,  // very subtle rumble
  harmonic2:   0.02,
  harmonic3:   0.012,
  ventilation: 0.038,  // soft hiss
  sea:         0.05,   // low wash
  wind:        0.07,   // only on wings
};

function createNoiseBuffer(ctx: AudioContext, seconds = 3): AudioBuffer {
  const length = ctx.sampleRate * seconds;
  const buf    = ctx.createBuffer(1, length, ctx.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function ramp(gain: GainNode, target: number, ctx: AudioContext, timeConstant = 0.6) {
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setTargetAtTime(target, ctx.currentTime, timeConstant);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBridgeAudio(node: CameraNode, enabled: boolean) {
  const ctxRef     = useRef<AudioContext | null>(null);
  const startedRef = useRef(false);
  const timers     = useRef<ReturnType<typeof setTimeout>[]>([]);

  const gainRefs = useRef<{
    master:      GainNode | null;
    engine:      GainNode | null;
    harmonic2:   GainNode | null;
    harmonic3:   GainNode | null;
    ventilation: GainNode | null;
    sea:         GainNode | null;
    wind:        GainNode | null;
    vhf:         GainNode | null;
  }>({
    master: null, engine: null, harmonic2: null, harmonic3: null,
    ventilation: null, sea: null, wind: null, vhf: null,
  });

  const buildGraph = useCallback((ctx: AudioContext) => {
    const g = gainRefs.current;

    // ── Master ────────────────────────────────────────────────────────
    g.master = ctx.createGain();
    g.master.gain.value = MASTER_VOL;
    g.master.connect(ctx.destination);

    // ── 1. Engine hum: 62 Hz sine, gentle LFO wobble ──────────────────
    g.engine = ctx.createGain();
    g.engine.gain.value = BASE.engine;
    g.engine.connect(g.master);

    const engOsc = ctx.createOscillator();
    engOsc.type = 'sine';
    engOsc.frequency.value = 62;

    // Very slow, tiny pitch wobble — like rpm fluctuation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 0.8;
    lfo.connect(lfoAmt);
    lfoAmt.connect(engOsc.frequency);

    // Mild lowpass so it stays subby, not buzzy
    const engLP = ctx.createBiquadFilter();
    engLP.type = 'lowpass';
    engLP.frequency.value = 180;

    engOsc.connect(engLP);
    engLP.connect(g.engine);
    engOsc.start();
    lfo.start();

    // ── 2. Harmonics (very quiet overtones for body) ───────────────────
    g.harmonic2 = ctx.createGain();
    g.harmonic2.gain.value = BASE.harmonic2;
    g.harmonic2.connect(g.master);

    g.harmonic3 = ctx.createGain();
    g.harmonic3.gain.value = BASE.harmonic3;
    g.harmonic3.connect(g.master);

    const h2 = ctx.createOscillator(); h2.frequency.value = 124; h2.type = 'sine';
    const h3 = ctx.createOscillator(); h3.frequency.value = 186; h3.type = 'sine';
    h2.connect(g.harmonic2); h3.connect(g.harmonic3);
    h2.start(); h3.start();

    // ── 3. Ventilation: narrow-band noise, like a distant AC unit ─────
    g.ventilation = ctx.createGain();
    g.ventilation.gain.value = BASE.ventilation;
    g.ventilation.connect(g.master);

    const ventNoise = ctx.createBufferSource();
    ventNoise.buffer = createNoiseBuffer(ctx, 4);
    ventNoise.loop   = true;

    // Narrow bandpass to make it sound like distant airflow, not hiss
    const ventBP = ctx.createBiquadFilter();
    ventBP.type = 'bandpass';
    ventBP.frequency.value = 420;
    ventBP.Q.value = 0.4;

    const ventLP = ctx.createBiquadFilter();
    ventLP.type = 'lowpass';
    ventLP.frequency.value = 700;

    ventNoise.connect(ventBP);
    ventBP.connect(ventLP);
    ventLP.connect(g.ventilation);
    ventNoise.start();

    // ── 4. Sea ambient: low-frequency wash ────────────────────────────
    g.sea = ctx.createGain();
    g.sea.gain.value = BASE.sea;
    g.sea.connect(g.master);

    const seaNoise = ctx.createBufferSource();
    seaNoise.buffer = createNoiseBuffer(ctx, 5);
    seaNoise.loop   = true;

    // Very low pass — just the bass rumble of water against hull
    const seaLP = ctx.createBiquadFilter();
    seaLP.type = 'lowpass';
    seaLP.frequency.value = 160;
    seaLP.Q.value = 0.3;

    seaNoise.connect(seaLP);
    seaLP.connect(g.sea);
    seaNoise.start();

    // ── 5. Wind: only on wing positions ───────────────────────────────
    g.wind = ctx.createGain();
    g.wind.gain.value = 0; // starts at zero, profile applies it
    g.wind.connect(g.master);

    const windNoise = ctx.createBufferSource();
    windNoise.buffer = createNoiseBuffer(ctx, 6);
    windNoise.loop   = true;

    // Bandpass around 600-1400 Hz for that open-air rush sound
    const windBP = ctx.createBiquadFilter();
    windBP.type = 'bandpass';
    windBP.frequency.value = 900;
    windBP.Q.value = 1.2;

    // Slow gust LFO
    const gustLFO = ctx.createOscillator();
    gustLFO.frequency.value = 0.09;
    const gustAmt = ctx.createGain();
    gustAmt.gain.value = 0.025;
    gustLFO.connect(gustAmt);
    gustAmt.connect(g.wind.gain);

    windNoise.connect(windBP);
    windBP.connect(g.wind);
    windNoise.start();
    gustLFO.start();

    // ── 6. VHF squelch node (triggered rarely via scheduler) ──────────
    g.vhf = ctx.createGain();
    g.vhf.gain.value = 1;
    g.vhf.connect(g.master);

  }, []);

  // ── VHF squelch: a brief, quiet static burst ─────────────────────────────
  const fireVHF = useCallback((ctx: AudioContext) => {
    const g = gainRefs.current;
    if (!g.vhf) return;

    const t      = ctx.currentTime + 0.05;
    const dur    = 0.06 + Math.random() * 0.12;
    const buf    = createNoiseBuffer(ctx, 0.4);
    const src    = ctx.createBufferSource();
    src.buffer   = buf;

    const bp     = ctx.createBiquadFilter();
    bp.type      = 'bandpass';
    bp.frequency.value = 2200;
    bp.Q.value   = 2.5;

    const env    = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.04, t + 0.008); // very quiet
    env.gain.setValueAtTime(0.04, t + dur - 0.01);
    env.gain.linearRampToValueAtTime(0, t + dur);

    src.connect(bp);
    bp.connect(env);
    env.connect(g.vhf);
    src.start(t);
    src.stop(t + dur + 0.05);
  }, []);

  // ── VHF scheduler: fires rarely, only on interior nodes ──────────────────
  const scheduleVHF = useCallback((ctx: AudioContext, profile: NodeProfile) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (profile.wind > 0.5) return; // no radio on wing positions

    const loop = () => {
      if (!ctxRef.current) return;
      fireVHF(ctx);
      // Every 25–90 seconds — rare enough to feel authentic not annoying
      const next = 25000 + Math.random() * 65000;
      timers.current.push(setTimeout(loop, next));
    };

    // Delayed first fire so it doesn't blurt on load
    const initial = 15000 + Math.random() * 30000;
    timers.current.push(setTimeout(loop, initial));
  }, [fireVHF]);

  // ── Apply profile gains ───────────────────────────────────────────────────
  const applyProfile = useCallback((ctx: AudioContext, profile: NodeProfile) => {
    const g = gainRefs.current;
    if (!g.master) return;
    ramp(g.engine!,      BASE.engine      * profile.engine,      ctx);
    ramp(g.harmonic2!,   BASE.harmonic2   * profile.engine,      ctx);
    ramp(g.harmonic3!,   BASE.harmonic3   * profile.engine,      ctx);
    ramp(g.ventilation!, BASE.ventilation * profile.ventilation, ctx);
    ramp(g.sea!,         BASE.sea         * profile.sea,         ctx);
    ramp(g.wind!,        BASE.wind        * profile.wind,        ctx, 1.2);
  }, []);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    buildGraph(ctx);
    const profile = NODE_PROFILES[node];
    applyProfile(ctx, profile);
    scheduleVHF(ctx, profile);
  }, [node, buildGraph, applyProfile, scheduleVHF]);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    ctxRef.current?.close();
    ctxRef.current     = null;
    startedRef.current = false;
    const g = gainRefs.current;
    (Object.keys(g) as (keyof typeof g)[]).forEach(k => { g[k] = null; });
  }, []);

  useEffect(() => {
    if (enabled) start();
    else         stop();
    return () => { if (!enabled) stop(); };
  }, [enabled]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !startedRef.current) return;
    const profile = NODE_PROFILES[node];
    applyProfile(ctx, profile);
    scheduleVHF(ctx, profile);
  }, [node]);

  useEffect(() => () => stop(), []);
}