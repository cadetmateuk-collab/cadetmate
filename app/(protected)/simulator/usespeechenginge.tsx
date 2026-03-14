'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallerID = 'bosun' | 'master' | 'ecr' | 'chief_officer' | 'security';

export type SpeechStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'responding';

export interface SpeechEngineState {
  status: SpeechStatus;
  transcript: string;
  lastResponse: string;
  lastResponseDesc: string;
  error: string | null;
}

export interface SpeechEngineControls {
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

// ─── Clip Definitions ─────────────────────────────────────────────────────────
// Each caller has their own audio library. Add/remove files here as needed.

interface AudioClip {
  file: string;
  desc: string;
  /** Tags used by AI prompt to identify this clip */
  tags: string[];
}

const CLIP_LIBRARIES: Record<CallerID, AudioClip[]> = {
  bosun: [
    { file: '/audio/bosun/bsn_go_ahead.wav',                     desc: 'Go ahead',                          tags: ['greeting', 'radio_call', 'ready', 'acknowledge_call'] },
    { file: '/audio/bosun/bsn_we_are_on_deck_now.wav',           desc: 'We are on deck now',                tags: ['arrived', 'on_deck', 'in_position', 'confirm_arrival'] },
    { file: '/audio/bosun/bsn_okay_copy.wav',                    desc: 'Okay, copy',                        tags: ['acknowledge', 'understood', 'info_received', 'noted'] },
    { file: '/audio/bosun/bsn_understood_proceeding.wav',        desc: 'Understood, proceeding',            tags: ['moving', 'order_received', 'proceeding', 'on_way'] },
    { file: '/audio/bosun/bsn_repeat_last_message.wav',          desc: 'Repeat last message',               tags: ['unclear', 'repeat', 'say_again', 'not_heard'] },
    { file: '/audio/bosun/bsn_wait_confirm_instruction.wav',     desc: 'Wait, confirm instruction',         tags: ['unsafe', 'ambiguous', 'need_clarification', 'unsafe_order'] },
    { file: '/audio/bosun/bsn_fire_party_on_deck.wav',           desc: 'Fire party on deck',                tags: ['fire_team_ready', 'fire_party', 'crew_deployed', 'firefighters'] },
    { file: '/audio/bosun/bsn_fire_contained.wav',               desc: 'Fire contained',                    tags: ['fire_controlled', 'fire_out', 'stable', 'contained'] },
    { file: '/audio/bosun/bsn_fire_spreading_slightly.wav',      desc: 'Fire spreading slightly',           tags: ['fire_growing', 'spreading', 'worsening', 'deteriorating'] },
    { file: '/audio/bosun/bsn_fire_main_deck_stbd_side.wav',     desc: 'Fire on main deck starboard side',  tags: ['fire_location', 'where_fire', 'fire_position', 'starboard'] },
    { file: '/audio/bosun/bsn_heavy_smoke_no_flame.wav',         desc: 'Heavy smoke, no flame',             tags: ['smoke', 'no_fire', 'visibility', 'smoke_only'] },
    { file: '/audio/bosun/bsn_hoses_charged.wav',                desc: 'Hoses charged',                     tags: ['hoses_ready', 'water_on', 'firefighting_ready', 'pressure_good'] },
    { file: '/audio/bosun/bsn_replace_leaky_hose.wav',           desc: 'Replace leaky hose',                tags: ['equipment_fault', 'hose_leak', 'problem', 'hose_issue'] },
    { file: '/audio/bosun/bsn_crew_safe_working_hard.wav',       desc: 'Crew safe, working hard',           tags: ['crew_status', 'crew_ok', 'working', 'crew_welfare'] },
    { file: '/audio/bosun/bsn_no_injury_all_crew_accounted.wav', desc: 'No injury, all crew accounted',     tags: ['no_casualties', 'headcount_ok', 'safe', 'all_present'] },
    { file: '/audio/bosun/bsn_all_for_now_will_update.wav',      desc: 'All for now, will update',          tags: ['end_transmission', 'standby', 'nothing_else', 'will_report'] },
    { file: '/audio/bosun/bsn_anchor_clear_and_ready.wav',       desc: 'Anchor clear and ready',            tags: ['anchor_ready', 'anchor_status', 'forward_station', 'anchoring'] },
    { file: '/audio/bosun/bsn_mooring_line_chaffed_but_holding.wav', desc: 'Mooring line chaffed but holding', tags: ['mooring', 'lines', 'line_condition', 'chaffing'] },
    { file: '/audio/bosun/bsn_checking_for_hotspots.wav',        desc: 'Checking for hotspots',             tags: ['inspection', 'hotspot_check', 'fire_patrol', 'thermal'] },
    { file: '/audio/bosun/bsn_slippery_deck.wav',                desc: 'Slippery deck',                     tags: ['deck_conditions', 'hazard', 'wet', 'slippery'] },
    { file: '/audio/bosun/bsn_need_more_light_on_deck.wav',      desc: 'Need more light on deck',           tags: ['lighting', 'dark', 'need_lights', 'visibility_low'] },
    { file: '/audio/bosun/bsn_damage_railing.wav',               desc: 'Damage to railing',                 tags: ['structural_damage', 'railing', 'damage', 'impact'] },
    { file: '/audio/bosun/bsn_fcastle_checked_no_flooding.wav',  desc: 'Fcastle checked, no flooding',      tags: ['flooding_check', 'forward', 'no_flood', 'watertight'] },
    { file: '/audio/bosun/bsn_boundary_cooling_started.wav',     desc: 'Boundary cooling started',          tags: ['cooling', 'boundary', 'prevent_spread', 'adjacent_spaces'] },
    { file: '/audio/bosun/bsn_cargo_lashing_loose_securing.wav', desc: 'Cargo lashing loose, securing',     tags: ['cargo', 'lashing', 'securing', 'deck_cargo'] },
    { file: '/audio/bosun/bsn_strong_wind_poor_vis.wav',         desc: 'Strong wind, poor visibility',      tags: ['weather', 'wind', 'visibility', 'conditions'] },
    { file: '/audio/bosun/bsn_situation_under_control.wav',      desc: 'Situation under control',           tags: ['situation_ok', 'stable', 'under_control', 'good'] },
    { file: '/audio/bosun/bsn_situation_worsening.wav',          desc: 'Situation worsening',               tags: ['deteriorating', 'getting_worse', 'urgent', 'bad'] },
    { file: '/audio/bosun/bsn_please_advise_next_action.wav',    desc: 'Please advise next action',         tags: ['awaiting_orders', 'need_instruction', 'what_next', 'guidance'] },
  ],

  master: [
    { file: '/audio/master/mst_on_my_way.wav',               desc: 'On my way to the bridge',          tags: ['coming', 'responding', 'en_route', 'bridge_bound'] },
    { file: '/audio/master/mst_understood.wav',              desc: 'Understood',                       tags: ['acknowledge', 'copy', 'noted', 'understood'] },
    { file: '/audio/master/mst_sound_general_alarm.wav',     desc: 'Sound the general alarm',          tags: ['general_alarm', 'alarm_order', 'muster', 'emergency_order'] },
    { file: '/audio/master/mst_reduce_speed.wav',            desc: 'Reduce speed immediately',         tags: ['slow_down', 'speed_reduction', 'reduce_speed', 'engines'] },
    { file: '/audio/master/mst_maintain_course.wav',         desc: 'Maintain current course',          tags: ['hold_course', 'steady', 'no_change', 'maintain'] },
    { file: '/audio/master/mst_alter_course_stbd.wav',       desc: 'Alter course to starboard',        tags: ['turn_right', 'starboard', 'course_change', 'maneuver'] },
    { file: '/audio/master/mst_mayday_authorized.wav',       desc: 'Mayday call authorized',           tags: ['mayday', 'distress', 'emergency_call', 'send_distress'] },
    { file: '/audio/master/mst_abandon_ship.wav',            desc: 'Prepare to abandon ship',          tags: ['abandon', 'evacuation', 'lifeboats', 'emergency'] },
    { file: '/audio/master/mst_good_work.wav',               desc: 'Good work, carry on',              tags: ['praise', 'continue', 'well_done', 'carry_on'] },
    { file: '/audio/master/mst_call_coastguard.wav',         desc: 'Call the coastguard',              tags: ['coastguard', 'call_authorities', 'contact_shore', 'report'] },
  ],

  ecr: [
    { file: '/audio/ecr/ecr_engines_ready.wav',              desc: 'Engines ready',                    tags: ['engine_ready', 'power_available', 'standby', 'propulsion'] },
    { file: '/audio/ecr/ecr_full_ahead.wav',                 desc: 'Full ahead confirmed',             tags: ['full_speed', 'full_ahead', 'engine_order', 'speed'] },
    { file: '/audio/ecr/ecr_stop_engines.wav',               desc: 'Engines stopped',                  tags: ['engines_off', 'stop', 'zero_power', 'stop_engines'] },
    { file: '/audio/ecr/ecr_emergency_power.wav',            desc: 'Emergency power online',           tags: ['emergency_power', 'generator', 'backup', 'power_restored'] },
    { file: '/audio/ecr/ecr_blackout_investigating.wav',     desc: 'Investigating blackout cause',     tags: ['blackout', 'power_failure', 'investigating', 'cause'] },
    { file: '/audio/ecr/ecr_fuel_issue.wav',                 desc: 'Fuel system issue detected',       tags: ['fuel', 'problem', 'fuel_system', 'alert'] },
    { file: '/audio/ecr/ecr_fire_suppression_armed.wav',     desc: 'Fire suppression system armed',    tags: ['fire_suppression', 'co2', 'ready_to_flood', 'fire_fighting'] },
    { file: '/audio/ecr/ecr_understood.wav',                 desc: 'Understood, actioning',            tags: ['acknowledge', 'actioning', 'on_it', 'copy'] },
    { file: '/audio/ecr/ecr_speed_reduced.wav',              desc: 'Speed reduced as ordered',         tags: ['speed_done', 'slowed', 'reduced', 'engine_response'] },
    { file: '/audio/ecr/ecr_bilge_pumps_running.wav',        desc: 'Bilge pumps running',              tags: ['bilge', 'pumps', 'flooding', 'dewatering'] },
  ],

  chief_officer: [
    { file: '/audio/chief/co_muster_complete.wav',           desc: 'Muster complete, all accounted',   tags: ['muster', 'headcount', 'all_present', 'accounted'] },
    { file: '/audio/chief/co_lifeboats_ready.wav',           desc: 'Lifeboats ready for lowering',     tags: ['lifeboats', 'ready', 'abandon', 'lowering'] },
    { file: '/audio/chief/co_cargo_secure.wav',              desc: 'Cargo secured and lashed',         tags: ['cargo', 'lashed', 'secure', 'tied_down'] },
    { file: '/audio/chief/co_on_my_way.wav',                 desc: 'On my way',                        tags: ['coming', 'en_route', 'responding', 'bridge_bound'] },
    { file: '/audio/chief/co_deck_team_ready.wav',           desc: 'Deck team standing by',            tags: ['deck_team', 'ready', 'standing_by', 'crew_ready'] },
    { file: '/audio/chief/co_understood.wav',                desc: 'Understood',                       tags: ['copy', 'acknowledged', 'noted', 'understood'] },
    { file: '/audio/chief/co_fire_team_deployed.wav',        desc: 'Fire team deployed to location',   tags: ['fire_team', 'deployed', 'responding', 'fire'] },
    { file: '/audio/chief/co_watertight_doors_closed.wav',   desc: 'All watertight doors closed',      tags: ['watertight', 'doors', 'closed', 'sealed'] },
  ],

  security: [
    { file: '/audio/security/sec_bridge_secured.wav',        desc: 'Bridge access secured',            tags: ['bridge', 'secured', 'access', 'locked'] },
    { file: '/audio/security/sec_mustering_crew.wav',        desc: 'Mustering crew to assembly points', tags: ['muster', 'assembly', 'crew', 'gathering'] },
    { file: '/audio/security/sec_all_clear.wav',             desc: 'All clear, no threat detected',    tags: ['all_clear', 'safe', 'no_threat', 'clear'] },
    { file: '/audio/security/sec_intruder_alert.wav',        desc: 'Possible intruder detected',       tags: ['intruder', 'threat', 'security_breach', 'alert'] },
    { file: '/audio/security/sec_understood.wav',            desc: 'Understood',                       tags: ['copy', 'acknowledged', 'noted', 'understood'] },
    { file: '/audio/security/sec_patrol_underway.wav',       desc: 'Security patrol underway',         tags: ['patrol', 'checking', 'monitoring', 'deck_patrol'] },
  ],
};

// ─── Caller Personas (used in AI prompt) ─────────────────────────────────────

const CALLER_PERSONAS: Record<CallerID, string> = {
  bosun: `You are the Bosun on a merchant vessel responding to bridge radio communications.
You are experienced, direct, and professional. You report conditions exactly as you observe them.
You respond using ONLY pre-approved standardized messages. No improvisation.`,

  master: `You are the Master (Captain) of a merchant vessel responding to a call from the bridge officer.
You are commanding, decisive, and brief. You give clear orders or acknowledge information.
You respond using ONLY pre-approved standardized messages.`,

  ecr: `You are the Chief Engineer in the Engine Control Room responding to a bridge call.
You are technical, precise, and focused on machinery status. You confirm engine orders and report faults.
You respond using ONLY pre-approved standardized messages.`,

  chief_officer: `You are the Chief Officer (First Mate) responding to a call from the bridge.
You are professional and organized. You report crew status, cargo, and deck operations.
You respond using ONLY pre-approved standardized messages.`,

  security: `You are the Security Officer responding to a bridge call.
You are vigilant, concise, and clear. You report security status and respond to threats.
You respond using ONLY pre-approved standardized messages.`,
};

// ─── Keyword Fallback ─────────────────────────────────────────────────────────
// Used when no API key is available. Maps transcript keywords → tag to look up.

function keywordFallback(transcript: string, callerId: CallerID): string {
  const t = transcript.toLowerCase();
  const clips = CLIP_LIBRARIES[callerId];

  // Priority-ordered keyword → tag mappings (shared across callers)
  const rules: Array<{ test: (s: string) => boolean; tag: string }> = [
    { test: s => (s.includes('bosun') || s.includes('bridge')) && (s.includes('copy') || s.includes('come in') || s.includes('read')), tag: 'greeting' },
    { test: s => s.includes('proceed') || s.includes('go to') || s.includes('move to') || s.includes('head to'), tag: 'moving' },
    { test: s => s.includes('repeat') || s.includes('say again'), tag: 'repeat' },
    { test: s => s.includes('fire') && (s.includes('where') || s.includes('location')), tag: 'fire_location' },
    { test: s => s.includes('fire') && (s.includes('team') || s.includes('party') || s.includes('crew')), tag: 'fire_team_ready' },
    { test: s => s.includes('fire') && (s.includes('contain') || s.includes('control') || s.includes('out')), tag: 'fire_controlled' },
    { test: s => s.includes('fire') && (s.includes('spread') || s.includes('worse')), tag: 'spreading' },
    { test: s => s.includes('smoke'), tag: 'smoke' },
    { test: s => s.includes('hose') && (s.includes('leak') || s.includes('replace')), tag: 'hose_issue' },
    { test: s => s.includes('hose') || s.includes('water pressure'), tag: 'hoses_ready' },
    { test: s => s.includes('injur') || s.includes('casualt') || s.includes('hurt'), tag: 'no_casualties' },
    { test: s => s.includes('crew') || s.includes('everyone'), tag: 'crew_status' },
    { test: s => s.includes('anchor'), tag: 'anchor_ready' },
    { test: s => s.includes('mooring') || s.includes('lines'), tag: 'mooring' },
    { test: s => s.includes('flood') || s.includes('water ingress'), tag: 'flooding_check' },
    { test: s => s.includes('cargo') || s.includes('lash'), tag: 'cargo' },
    { test: s => s.includes('cool') || s.includes('boundary'), tag: 'cooling' },
    { test: s => s.includes('hotspot') || s.includes('patrol'), tag: 'inspection' },
    { test: s => s.includes('damage') || s.includes('broken'), tag: 'structural_damage' },
    { test: s => s.includes('weather') || s.includes('wind') || s.includes('visibility'), tag: 'weather' },
    { test: s => s.includes('light') || s.includes('dark'), tag: 'lighting' },
    { test: s => s.includes('deck') && s.includes('slip'), tag: 'hazard' },
    { test: s => s.includes('alarm') || s.includes('muster'), tag: 'general_alarm' },
    { test: s => s.includes('abandon'), tag: 'abandon' },
    { test: s => s.includes('speed') && (s.includes('reduc') || s.includes('slow')), tag: 'speed_reduction' },
    { test: s => s.includes('blackout') || s.includes('power fail') || s.includes('no power'), tag: 'blackout' },
    { test: s => s.includes('engine') && s.includes('stop'), tag: 'stop_engines' },
    { test: s => s.includes('engine') || s.includes('propulsion'), tag: 'engine_ready' },
    { test: s => s.includes('mayday') || s.includes('distress'), tag: 'mayday' },
    { test: s => s.includes('situation') && (s.includes('worse') || s.includes('bad')), tag: 'deteriorating' },
    { test: s => s.includes('situation') || s.includes('status') || s.includes('update'), tag: 'situation_ok' },
    { test: s => s.includes('advise') || s.includes('what next') || s.includes('orders'), tag: 'awaiting_orders' },
    { test: s => s.includes('stand by') || s.includes('standby') || s.includes('wait'), tag: 'end_transmission' },
  ];

  for (const rule of rules) {
    if (rule.test(t)) {
      const match = clips.find(c => c.tags.includes(rule.tag));
      if (match) return match.file;
    }
  }

  // Default fallback — find "acknowledge" clip
  return clips.find(c => c.tags.includes('acknowledge') || c.tags.includes('noted'))?.file
    ?? clips[0].file;
}

// ─── Build AI system prompt ───────────────────────────────────────────────────

function buildSystemPrompt(callerId: CallerID): string {
  const clips = CLIP_LIBRARIES[callerId];
  const persona = CALLER_PERSONAS[callerId];

  const clipList = clips
    .map((c, i) => `${i}: [${c.tags.join(', ')}] → "${c.desc}"`)
    .join('\n');

  return `${persona}

You have EXACTLY ${clips.length} pre-recorded audio clips available, numbered 0 to ${clips.length - 1}.
Choose the single most appropriate clip index for the officer's message.

CLIPS:
${clipList}

RULES:
- Consider the officer's intent, not just exact words
- Pick the clip that best matches the situation and context
- During emergencies, prioritise safety-relevant responses
- If message is unclear/garbled, pick "repeat" or "not_heard" tagged clip
- If order seems unsafe, pick "unsafe_order" or "ambiguous" tagged clip
- Respond with ONLY the number (0 to ${clips.length - 1}). Nothing else.`;
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

interface UseSpeechEngineOptions {
  callerId: CallerID;
  apiKey?: string;
  onResponse?: (clip: AudioClip, transcript: string) => void;
  onTranscript?: (text: string) => void;
}

export function useSpeechEngine({
  callerId,
  apiKey,
  onResponse,
  onTranscript,
}: UseSpeechEngineOptions): [SpeechEngineState, SpeechEngineControls] {

  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [lastResponseDesc, setLastResponseDesc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<unknown>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSupported = useRef(false);

  // Always-fresh ref for processing so stale closures never affect recognition
  const callerIdRef = useRef(callerId);
  const apiKeyRef = useRef(apiKey);
  callerIdRef.current = callerId;
  apiKeyRef.current = apiKey;

  // ── Init speech recognition ───────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognition) | undefined
      ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognition) | undefined;

    if (!SR) { isSupported.current = false; return; }
    isSupported.current = true;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 3;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      // Use highest-confidence alternative
      const results = Array.from({ length: e.results[0].length }, (_, i) => e.results[0][i]);
      const best = results.sort((a, b) => b.confidence - a.confidence)[0];
      const text = best.transcript.toLowerCase().trim();

      setTranscript(text);
      onTranscript?.(text);
      setStatus('processing');
      processMessage(text);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setError(`Speech error: ${e.error}`);
      setStatus('idle');
    };

    rec.onend = () => {
      if (status !== 'processing' && status !== 'responding') setStatus('idle');
    };

    recognitionRef.current = rec;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Process transcript → select clip ─────────────────────────────────────

  const processMessage = useCallback(async (text: string) => {
    const currentCallerId = callerIdRef.current;
    const currentApiKey = apiKeyRef.current;
    const clips = CLIP_LIBRARIES[currentCallerId];

    let selectedClip: AudioClip;

    if (currentApiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: buildSystemPrompt(currentCallerId) },
              { role: 'user', content: `Officer said: "${text}"\nClip number:` },
            ],
            max_tokens: 5,
            temperature: 0.1,
          }),
        });

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content?.trim();
        const idx = parseInt(raw ?? '', 10);

        if (!isNaN(idx) && idx >= 0 && idx < clips.length) {
          selectedClip = clips[idx];
        } else {
          // AI gave bad response, fall back
          selectedClip = clips.find(c => c.file === keywordFallback(text, currentCallerId))
            ?? clips[0];
        }
      } catch {
        // Network / API error — fall back to keywords
        selectedClip = clips.find(c => c.file === keywordFallback(text, currentCallerId))
          ?? clips[0];
      }
    } else {
      // No API key — keyword matching
      const file = keywordFallback(text, currentCallerId);
      selectedClip = clips.find(c => c.file === file) ?? clips[0];
    }

    playClip(selectedClip, text);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Play selected audio clip ──────────────────────────────────────────────

  const playClip = useCallback((clip: AudioClip, originalTranscript: string) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setStatus('responding');
    setLastResponse(clip.file);
    setLastResponseDesc(clip.desc);
    onResponse?.(clip, originalTranscript);

    const audio = new Audio(clip.file);
    audio.volume = 0.85;
    audioRef.current = audio;

    const done = () => {
      setStatus('idle');
      audioRef.current = null;
    };

    audio.onended = done;
    audio.onerror = () => {
      // Audio file not found — still mark as responded, just silently
      console.warn(`[SpeechEngine] Audio not found: ${clip.file} (${clip.desc})`);
      done();
    };

    audio.play().catch(() => done());
  }, [onResponse]);

  // ── Public controls ───────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const rec = recognitionRef.current as SpeechRecognition | null;
    if (!rec) return;
    setError(null);
    setTranscript('');
    setStatus('listening');
    try {
      rec.start();
    } catch {
      setStatus('idle');
    }
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current as SpeechRecognition | null;
    if (rec) try { rec.stop(); } catch { /* ignore */ }
    if (status === 'listening') setStatus('idle');
  }, [status]);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      const rec = recognitionRef.current as SpeechRecognition | null;
      if (rec) try { rec.abort(); } catch { /* ignore */ }
    };
  }, []);

  return [
    { status, transcript, lastResponse, lastResponseDesc, error },
    { startListening, stopListening, isSupported: isSupported.current },
  ];
}

// ─── Convenience: get caller display name ────────────────────────────────────

export function getCallerLabel(id: CallerID): string {
  const labels: Record<CallerID, string> = {
    bosun: 'Bosun',
    master: 'Master',
    ecr: 'Engine Control Room',
    chief_officer: 'Chief Officer',
    security: 'Security',
  };
  return labels[id];
}

// ─── Convenience: get all available clips for a caller ───────────────────────

export function getClipsForCaller(id: CallerID): AudioClip[] {
  return CLIP_LIBRARIES[id];
}