'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { BridgeScene, CameraNode } from './BridgeScene';
import { useBridgeInteractions } from './BridgeInteractions';
import { BridgeNav } from './BridgeNav';
import { useBridgeAudio } from './useBridgeAudio';
import { RadioArm } from './RadioArm';
import { PhoneArm, PhoneArmHandle } from './PhoneArm';
import { useArmSway } from './useArmSway';
import { useSessionReporter } from '@/lib/useSessionReporter';
import { useLogbook, LogbookEditOverlay } from './LogbookPlane';

const DEBUG_OVERLAYS = false;

// ══════════════════════════════════════════════════════════════════════════════
// ── TYPES (from old sim) ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

interface LogEntry {
  time: string;
  heading: string;
  speed: string;
  depth: string;
  visibility: string;
  event: string;
}

interface ActionLog {
  timestamp: number;
  action: string;
  location: CameraNode;
  correct: boolean;
  expectedOrder?: number;
  actualOrder: number;
}

interface ScenarioEvent {
  id: string;
  type: 'alarm' | 'visual' | 'ship_movement' | 'lighting' | 'sound';
  trigger: 'immediate' | 'delayed';
  delay?: number;
  data: Record<string, unknown>;
}

interface ChecklistItem {
  id: string;
  action: string;
  location: CameraNode;
  buttonId: string;
  order: number;
  completed: boolean;
  timeCompleted?: number;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  events: ScenarioEvent[];
  checklist: ChecklistItem[];
  timeLimit?: number;
}

interface PhoneContact {
  id: string;
  buttonId: string;
  name: string;
  title: string;
  extension: string;
  icon: string;
  audioFile: string;
}

// ── Audio helpers ─────────────────────────────────────────────────────────────

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.08,
  type: OscillatorType = 'sine'
) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.04);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function playAudioFile(src: string, volume = 0.8): HTMLAudioElement {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(() => {});
  return audio;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── STATIC DATA ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const PHONE_CONTACTS: PhoneContact[] = [
  { id: 'master',        buttonId: 'phone-master',        name: 'MASTER',              title: 'Capt. R. Voss',       extension: '501', icon: '🎖️', audioFile: '/audio/phone/master_response.wav' },
  { id: 'ecr',           buttonId: 'phone-ecr',           name: 'ENGINE CONTROL ROOM', title: 'Ch. Eng. M. Santos',  extension: '301', icon: '⚙️', audioFile: '/audio/phone/ecr_response.wav' },
  { id: 'chief-officer', buttonId: 'phone-chief-officer', name: 'CHIEF OFFICER',        title: '1st Off. K. Brennan', extension: '502', icon: '📋', audioFile: '/audio/phone/chief_officer_response.wav' },
  { id: 'security',      buttonId: 'phone-security',      name: 'SECURITY',             title: 'Security Officer',    extension: '601', icon: '🔒', audioFile: '/audio/phone/security_response.wav' },
];

const SCENARIOS: Scenario[] = [
  {
    id: 'man-overboard', name: 'Man Overboard',
    description: 'Crew member has fallen overboard. Execute immediate rescue procedures.',
    timeLimit: 300,
    events: [{ id: 'mob-phone', type: 'alarm', trigger: 'immediate', data: { active: true, type: 'phone' } }],
    checklist: [
      { id: 'mob-1', action: 'Answer emergency phone',                   location: 'helm',       buttonId: 'answer-phone-btn',          order: 1, completed: false },
      { id: 'mob-2', action: 'Activate GPS MOB Function',                location: 'psEcdis',    buttonId: 'ecdis',                     order: 2, completed: false },
      { id: 'mob-3', action: 'Deploy starboard bridge wing life buoy',   location: 'sbWing',     buttonId: 'deploy-lifebuoy-starboard', order: 3, completed: false },
      { id: 'mob-4', action: "Sound ship's MOB alarm",                   location: 'helm',       buttonId: 'alarm-mob',                 order: 4, completed: false },
      { id: 'mob-5', action: 'Call Master',                              location: 'psRadio',    buttonId: 'phone-master',              order: 5, completed: false },
      { id: 'mob-6', action: 'Inform ECR',                               location: 'psRadio',    buttonId: 'phone-ecr',                 order: 6, completed: false },
      { id: 'mob-7', action: 'Post lookout on starboard wing',           location: 'sbWing',     buttonId: 'starboard-lookout',         order: 7, completed: false },
      { id: 'mob-8', action: 'Reduce speed',                             location: 'helm',       buttonId: 'helm',                      order: 8, completed: false },
    ],
  },
  {
    id: 'blackout', name: 'Total Blackout',
    description: 'Complete power failure. Restore emergency systems and ensure vessel safety.',
    timeLimit: 600,
    events: [
      { id: 'blackout-lights', type: 'lighting', trigger: 'immediate',         data: { level: 0.1 } },
      { id: 'blackout-alarm',  type: 'alarm',    trigger: 'delayed', delay: 2000, data: { active: true } },
      { id: 'restore-lights',  type: 'lighting', trigger: 'delayed', delay: 5000, data: { level: 0.6 } },
    ],
    checklist: [
      { id: 'bo-1', action: 'Acknowledge blackout alarm',          location: 'helm',      buttonId: 'silence-alarm-btn', order: 1, completed: false },
      { id: 'bo-2', action: 'Check radar for traffic',             location: 'radar',     buttonId: 'radar',             order: 2, completed: false },
      { id: 'bo-3', action: 'Switch to manual steering',           location: 'helm',      buttonId: 'helm',              order: 3, completed: false },
      { id: 'bo-4', action: 'Verify position on ECDIS backup',     location: 'psEcdis',   buttonId: 'ecdis',             order: 4, completed: false },
      { id: 'bo-5', action: 'Post lookout on port wing',           location: 'psWing',    buttonId: 'port-lookout',      order: 5, completed: false },
      { id: 'bo-6', action: 'Verify starboard lookout posted',     location: 'sbWing',    buttonId: 'starboard-lookout', order: 6, completed: false },
      { id: 'bo-7', action: 'Make Pan-Pan call on VHF',            location: 'psRadio',   buttonId: 'vhf-radio',         order: 7, completed: false },
      { id: 'bo-8', action: 'Log blackout in deck log',            location: 'sbLogbook', buttonId: 'logbook',           order: 8, completed: false },
    ],
  },
  {
    id: 'fire-alarm', name: 'Fire in Engine Room',
    description: 'Fire detected in engine room. Implement fire response procedures.',
    timeLimit: 420,
    events: [{ id: 'fire-alarm', type: 'alarm', trigger: 'immediate', data: { active: true } }],
    checklist: [
      { id: 'fire-1', action: 'Sound general alarm',                           location: 'helm',      buttonId: 'silence-alarm-btn', order: 1, completed: false },
      { id: 'fire-2', action: 'Check ECDIS position',                          location: 'psEcdis',   buttonId: 'ecdis',             order: 2, completed: false },
      { id: 'fire-3', action: 'Stop engines',                                  location: 'helm',      buttonId: 'engine-telegraph',  order: 3, completed: false },
      { id: 'fire-4', action: 'Make Mayday call',                              location: 'psRadio',   buttonId: 'vhf-radio',         order: 4, completed: false },
      { id: 'fire-5', action: 'Prepare to abandon ship — check port side',     location: 'psWing',    buttonId: 'port-lookout',      order: 5, completed: false },
      { id: 'fire-6', action: 'Check starboard evacuation route',              location: 'sbWing',    buttonId: 'starboard-lookout', order: 6, completed: false },
      { id: 'fire-7', action: 'Log emergency in deck log',                     location: 'sbLogbook', buttonId: 'logbook',           order: 7, completed: false },
    ],
  },
  {
    id: 'collision-avoidance', name: 'Collision Avoidance',
    description: 'Vessel on collision course detected. Execute evasive maneuvers.',
    timeLimit: 180,
    events: [{ id: 'collision-alarm', type: 'alarm', trigger: 'delayed', delay: 3000, data: { active: true } }],
    checklist: [
      { id: 'col-1', action: 'Check radar for CPA/TCPA',           location: 'radar',     buttonId: 'radar',             order: 1, completed: false },
      { id: 'col-2', action: 'Verify position on ECDIS',           location: 'psEcdis',   buttonId: 'ecdis',             order: 2, completed: false },
      { id: 'col-3', action: 'Execute starboard turn',             location: 'helm',      buttonId: 'helm',              order: 3, completed: false },
      { id: 'col-4', action: 'Sound 5 short blasts',               location: 'helm',      buttonId: 'silence-alarm-btn', order: 4, completed: false },
      { id: 'col-5', action: 'Call other vessel on VHF Ch 16',     location: 'psRadio',   buttonId: 'vhf-radio',         order: 5, completed: false },
      { id: 'col-6', action: 'Post lookout on starboard wing',     location: 'sbWing',    buttonId: 'starboard-lookout', order: 6, completed: false },
      { id: 'col-7', action: 'Log incident',                       location: 'sbLogbook', buttonId: 'logbook',           order: 7, completed: false },
    ],
  },
];

// ── Colours matching BridgeNav palette ────────────────────────────────────────
const MONO_FONT = 'var(--font-manrope), system-ui, sans-serif';

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export default function ShipBridgeSimulator() {
  const [cameraNode, setCameraNode] = useState<CameraNode>('back');
  const [audioEnabled, setAudioEnabled]   = useState(false);
  const { screenDefs, objectDefs }        = useBridgeInteractions();

  const phoneArmRef = useRef<PhoneArmHandle | null>(null);
  const armSway     = useArmSway();
  const { ringPhone, stopRing } = useBridgeAudio(cameraNode, audioEnabled);

  // ── Session reporting ──────────────────────────────────────────────────────
  const reportPhoneIncomingRef = useRef<(from: string) => void>(() => {});

  const {
    reportCameraMove,
    reportPTT,
    reportPhoneRaised,
    reportPhoneDialled,
    reportPhoneOutgoing,
    reportPhoneAnswered,
    reportPhoneEnded,
    reportPhoneMissed,
    reportPhoneIncoming,
  } = useSessionReporter({
    onIncomingCall: (from) => {
      phoneArmRef.current?.triggerIncoming(from);
      reportPhoneIncomingRef.current(from);
      ringPhone();
    },
    onScenario: (scenario, message) => {
      console.log('[SCENARIO]', scenario, message);
    },
  });

  reportPhoneIncomingRef.current = reportPhoneIncoming;

  const handleCameraChange = useCallback((node: CameraNode) => {
    setCameraNode(node);
    reportCameraMove(node);
  }, [reportCameraMove]);

  // ══════════════════════════════════════════════════════════════════════════
  // ── PORTED FEATURE STATE ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // Scenario system
  const [currentScenario,    setCurrentScenario]    = useState<Scenario | null>(null);
  const [scenarioStartTime,  setScenarioStartTime]  = useState<number | null>(null);
  const [actionLog,          setActionLog]           = useState<ActionLog[]>([]);
  const [checklist,          setChecklist]           = useState<ChecklistItem[]>([]);
  const [scenarioComplete,   setScenarioComplete]   = useState(false);
  const [showResults,        setShowResults]         = useState(false);

  // Alarms
  const [alarmActive,   setAlarmActive]   = useState(false);
  const [phoneRinging,  setPhoneRinging]  = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<string | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lighting (for blackout scenario)
  const [lightsLevel, setLightsLevel] = useState(1);

  // VHF chatter
  const [vhfChatterEnabled, setVhfChatterEnabled] = useState(true);
  const vhfPlayingRef  = useRef(false);
  const vhfTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vhfAudioRef    = useRef<HTMLAudioElement | null>(null);

  // Internal phone panel
  const [phoneOpen,      setPhoneOpen]      = useState(false);
  const [activeCall,     setActiveCall]     = useState<string | null>(null);
  const [dialingContact, setDialingContact] = useState<string | null>(null);
  const [callTimer,      setCallTimer]      = useState(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Logbook
  const lb = useLogbook();
  const [showLogbook, setShowLogbook] = useState(false);
  const [logEntries, setLogEntries]   = useState<LogEntry[]>([
    { time: '1100', heading: '120 deg', speed: '15.6 kts', depth: '62.8m',  visibility: 'Clear', event: "Hourly Position 45° 34.8′ N 22° 03.6′ W" },
    { time: '1200', heading: '130 deg', speed: '15.0 kts', depth: '100.1m', visibility: 'Clear', event: "Noon Position 46° 12.4′ N 23° 01.2′ W — Wind F5, Sea State 4, Bar 1001, Temp +19" },
    { time: '1207', heading: '131 deg', speed: '15.1 kts', depth: '98.6m',  visibility: 'Clear', event: "Watch Handover Completed to Deck Cadet" },
  ]);
  const [shipInfo, setShipInfo] = useState(() => {
    const d = new Date();
    return {
      shipType: 'C.G.',
      hullNumber: '',
      date:  d.getDate().toString().padStart(2, '0'),
      month: (d.getMonth() + 1).toString().padStart(2, '0'),
      year:  d.getFullYear().toString(),
    };
  });

  // Scenario panel open/collapsed
  const [scenarioPanelOpen, setScenarioPanelOpen] = useState(true);

  // Audio context
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // ── PORTED LOGIC ──────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Logbook helpers ────────────────────────────────────────────────────────

  const addEventToLog = useCallback((event: string) => {
    setLogEntries(prev => [...prev, {
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      heading: '', speed: '', depth: '', visibility: '', event,
    }]);
  }, []);

  const addLogEntry = useCallback(() => {
    setLogEntries(prev => [...prev, {
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      heading: '', speed: '', depth: '', visibility: '', event: '',
    }]);
  }, []);

  const updateLogEntry = useCallback((i: number, field: keyof LogEntry, value: string) => {
    setLogEntries(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });
  }, []);

  const deleteLogEntry = useCallback((i: number) => {
    setLogEntries(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  // ── Action logging ─────────────────────────────────────────────────────────

  const logAction = useCallback((action: string, buttonId: string) => {
    if (!currentScenario) return;
    const timestamp = Date.now();
    setActionLog(prev => {
      const checklistItem = checklist.find(item => item.buttonId === buttonId);
      return [...prev, {
        timestamp, action, location: cameraNode,
        correct: checklistItem ? !checklistItem.completed : false,
        expectedOrder: checklistItem?.order,
        actualOrder: prev.length + 1,
      }];
    });
    setChecklist(prev => {
      const item = prev.find(i => i.buttonId === buttonId);
      if (!item || item.completed) return prev;
      const updated = prev.map(i => i.id === item.id ? { ...i, completed: true, timeCompleted: timestamp } : i);
      if (updated.every(i => i.completed)) {
        setTimeout(() => {
          setScenarioComplete(true);
          setAlarmActive(false);
          addEventToLog(`Scenario "${currentScenario?.name}" completed`);
        }, 100);
      }
      return updated;
    });
  }, [currentScenario, cameraNode, checklist, addEventToLog]);

  // ── Scenario execution ─────────────────────────────────────────────────────

  const executeEvent = useCallback((event: ScenarioEvent) => {
    switch (event.type) {
      case 'alarm':
        if ((event.data as { type?: string }).type === 'phone') setPhoneRinging(true);
        else setAlarmActive(!!(event.data as { active: boolean }).active);
        break;
      case 'lighting':
        setLightsLevel((event.data as { level: number }).level);
        break;
      case 'sound':
        playAudioFile((event.data as { soundFile: string }).soundFile);
        break;
    }
  }, []);

  const startScenario = useCallback((scenario: Scenario) => {
    setCurrentScenario(scenario);
    setScenarioStartTime(Date.now());
    setActionLog([]);
    setChecklist(scenario.checklist.map(item => ({ ...item, completed: false })));
    setScenarioComplete(false);
    setShowResults(false);
    scenario.events.forEach(event => {
      if (event.trigger === 'immediate') executeEvent(event);
      else if (event.delay) setTimeout(() => executeEvent(event), event.delay);
    });
  }, [executeEvent]);

  const calculatePerformance = useCallback(() => {
    if (!currentScenario || !scenarioStartTime || !actionLog.length) return null;
    const totalTime      = (actionLog[actionLog.length - 1].timestamp - scenarioStartTime) / 1000;
    const correctOrder   = actionLog.every(log => log.expectedOrder === undefined || log.expectedOrder === log.actualOrder);
    const completedActions = checklist.filter(i => i.completed).length;
    return { totalTime, correctOrder, completedActions, totalActions: checklist.length, score: (completedActions / checklist.length) * 100 };
  }, [currentScenario, scenarioStartTime, actionLog, checklist]);

  // ── Alarm actions ──────────────────────────────────────────────────────────

  const silenceAlarm = useCallback(() => {
    setAlarmActive(false);
    logAction('Silence/acknowledge alarm', 'silence-alarm-btn');
  }, [logAction]);

  const answerPhone = useCallback(() => {
    setPhoneRinging(false);
    playAudioFile('/audio/mob.wav', 0.8);
    logAction('Answer emergency phone', 'answer-phone-btn');
  }, [logAction]);

  // ── MOB Morse Oscar ────────────────────────────────────────────────────────

  const playMorseOscar = useCallback(() => {
    const ctx  = ensureAudioCtx();
    const now  = ctx.currentTime;
    const DASH = 1.5, GAP = 0.8;
    [0, 1, 2].forEach(i => {
      const t = now + i * (DASH + GAP);
      [180, 187].forEach(f => playTone(ctx, f, t, DASH, 0.4, 'sine'));
    });
    logAction('Sound Man Overboard alarm', 'alarm-mob');
    addEventToLog('Man Overboard alarm — Oscar signal sounded (--- --- ---)');
  }, [ensureAudioCtx, logAction, addEventToLog]);

  // ── Phone calls ────────────────────────────────────────────────────────────

  const endCall = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setActiveCall(null);
    setCallTimer(0);
    setDialingContact(null);
  }, []);

  const makeCall = useCallback((contact: PhoneContact) => {
    if (activeCall || dialingContact) return;
    setDialingContact(contact.id);
    setCallTimer(0);
    const ctx = ensureAudioCtx();
    const now = ctx.currentTime;
    [0, 0.5, 1.0].forEach(offset => playTone(ctx, 425, now + offset, 0.4, 0.08, 'sine'));
    setTimeout(() => {
      setDialingContact(null);
      setActiveCall(contact.id);
      logAction(`Called ${contact.name}`, contact.buttonId);
      callTimerRef.current = setInterval(() => setCallTimer(p => p + 1), 1000);
      playAudioFile(contact.audioFile, 0.85);
    }, 1800);
  }, [activeCall, dialingContact, ensureAudioCtx, logAction]);

  const formatCallTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── VHF chatter ────────────────────────────────────────────────────────────

  const playVHFChatter = useCallback(() => {
    if (!vhfChatterEnabled || vhfPlayingRef.current) return;
    const files = ['/vhfchatter/chatter1.mp3', '/vhfchatter/chatter2.mp3'];
    const audio = new Audio(files[Math.floor(Math.random() * files.length)]);
    audio.volume = 0.3;
    vhfPlayingRef.current  = true;
    vhfAudioRef.current    = audio;
    const schedule = () => {
      vhfPlayingRef.current = false;
      vhfTimeoutRef.current = setTimeout(playVHFChatter, 30000);
    };
    audio.onended = schedule;
    audio.onerror = schedule;
    audio.play().catch(schedule);
  }, [vhfChatterEnabled]);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Alarm beep
  useEffect(() => {
    if (!alarmActive) return;
    const ctx = ensureAudioCtx();
    const id  = setInterval(() => {
      const now = ctx.currentTime;
      playTone(ctx, 700, now, 0.45, 0.05, 'square');
      playTone(ctx, 800, now, 0.45, 0.05, 'sine');
    }, 700);
    alarmIntervalRef.current = id;
    return () => clearInterval(id);
  }, [alarmActive, ensureAudioCtx]);

  // Phone ring
  useEffect(() => {
    if (!phoneRinging) return;
    const ctx  = ensureAudioCtx();
    const ring = () => {
      const now = ctx.currentTime;
      playTone(ctx, 440, now, 1.8, 0.1, 'sine');
      playTone(ctx, 480, now, 1.8, 0.08, 'sine');
    };
    ring();
    const id = setInterval(ring, 4000);
    alarmIntervalRef.current = id;
    return () => clearInterval(id);
  }, [phoneRinging, ensureAudioCtx]);

  // VHF chatter scheduling
  useEffect(() => {
    if (!vhfChatterEnabled) {
      vhfAudioRef.current?.pause();
      vhfPlayingRef.current = false;
      if (vhfTimeoutRef.current) clearTimeout(vhfTimeoutRef.current);
      return;
    }
    vhfTimeoutRef.current = setTimeout(playVHFChatter, 5000);
    return () => { if (vhfTimeoutRef.current) clearTimeout(vhfTimeoutRef.current); };
  }, [vhfChatterEnabled, playVHFChatter]);

  // Cleanup
  useEffect(() => () => {
    audioCtxRef.current?.close();
    if (callTimerRef.current)  clearInterval(callTimerRef.current);
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    if (vhfTimeoutRef.current) clearTimeout(vhfTimeoutRef.current);
  }, []);

  // ── Reset lights when scenario ends ───────────────────────────────────────
  useEffect(() => {
    if (!currentScenario) setLightsLevel(1);
  }, [currentScenario]);

  // ══════════════════════════════════════════════════════════════════════════
  // ── RENDER ────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative' }}>

      {/* ── 3-D bridge scene ── */}
      <BridgeScene
        cameraNode={cameraNode}
        screenDefs={screenDefs}
        objectDefs={objectDefs}
        speedKnots={14}
        waveAngleDeg={45}
      />

      {/* ── Lighting overlay (blackout scenario) ── */}
      <div style={{
        position:   'absolute', inset: 0, zIndex: 5,
        background: 'black',
        opacity:    1 - lightsLevel,
        pointerEvents: 'none',
        transition: 'opacity 1s ease',
      }} />

      {/* ── Alarm flash overlay ── */}
      {alarmActive && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
          animation: 'alarmFlash 1s ease-in-out infinite',
          background: 'rgba(220,38,38,0.18)',
        }} />
      )}

      {/* ── Phone ringing overlay ── */}
      {phoneRinging && (
        <>
          <div style={{
            position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none',
            background: 'rgba(220,38,38,0.28)',
            animation: 'alarmFlash 1s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20, fontSize: '6rem', pointerEvents: 'none',
            animation: 'pulse 1s ease-in-out infinite',
          }}>📞</div>
          <button
            onClick={() => { ensureAudioCtx(); answerPhone(); }}
            style={{
              position: 'absolute', top: '62%', left: '50%', transform: 'translateX(-50%)',
              zIndex: 21, padding: '1rem 2.5rem', borderRadius: '9999px',
              background: 'linear-gradient(to bottom, #16a34a, #166534)',
              border: '4px solid #14532d', color: 'white',
              fontFamily: MONO_FONT, fontSize: '0.85rem', letterSpacing: '0.15em',
              fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 0 30px rgba(34,197,94,0.8)',
              animation: 'pulse 1s ease-in-out infinite',
            }}>
            📞 PICK UP PHONE
          </button>
        </>
      )}

      {/* ── Silence alarm button ── */}
      {alarmActive && (
        <div style={{ position: 'absolute', top: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <button
            onClick={() => { ensureAudioCtx(); silenceAlarm(); }}
            style={{
              padding: '1rem 2.5rem', borderRadius: '9999px',
              background: 'linear-gradient(to bottom, #dc2626, #991b1b)',
              border: '4px solid #7f1d1d', color: 'white',
              fontFamily: MONO_FONT, fontSize: '0.85rem', letterSpacing: '0.15em',
              fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 0 30px rgba(220,38,38,0.8)',
            }}>
            🔔 SILENCE ALARM
          </button>
        </div>
      )}

      {/* ── Bottom nav (existing) ── */}
      <BridgeNav current={cameraNode} onChange={handleCameraChange} />

      {/* ── Top-right: ambience toggle + debug ── */}
      <div style={{
        position: 'absolute', top: '1.25rem', right: '1.25rem',
        zIndex: 100, display: 'flex', gap: '0.5rem', alignItems: 'center',
      }}>
        {DEBUG_OVERLAYS && (
          <button
            onClick={() => { phoneArmRef.current?.triggerIncoming('CAPTAIN'); ringPhone(); }}
            style={topBtnStyle('#fbbf24', 'rgba(251,191,36,0.1)', 'rgba(251,191,36,0.4)')}>
            📞 CAPTAIN CALL
          </button>
        )}

        {/* VHF chatter toggle */}
        <button
          onClick={() => { setVhfChatterEnabled(v => !v); ensureAudioCtx(); }}
          style={topBtnStyle(
            vhfChatterEnabled ? '#34d399' : '#475569',
            vhfChatterEnabled ? 'rgba(52,211,153,0.12)' : 'rgba(2,11,24,0.82)',
            vhfChatterEnabled ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)',
          )}>
          <span style={{ fontSize: '0.85rem' }}>{vhfChatterEnabled ? '📻' : '📻'}</span>
          {vhfChatterEnabled ? 'VHF ON' : 'VHF OFF'}
        </button>

        {/* Ambience toggle */}
        <button
          onClick={() => setAudioEnabled(v => !v)}
          style={topBtnStyle(
            audioEnabled ? '#38bdf8' : '#475569',
            audioEnabled ? 'rgba(56,189,248,0.12)' : 'rgba(2,11,24,0.82)',
            audioEnabled ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)',
          )}>
          <span style={{ fontSize: '0.85rem' }}>{audioEnabled ? '🔊' : '🔇'}</span>
          {audioEnabled ? 'AMBIENCE ON' : 'AMBIENCE OFF'}
        </button>
      </div>

      {/* ── Arms ── */}
      <div style={{ position: 'fixed', inset: '-20px', zIndex: 90, pointerEvents: 'none', overflow: 'visible', ...armSway }}>
        <RadioArm
          imagePath="/shipimages/"
          pttPos={{ bottom: '20%', right: '68%', width: '28%', height: '25%' }}
          debugBorder={DEBUG_OVERLAYS}
          onPTTChange={reportPTT}
        />
        <PhoneArm
          imagePath="/shipimages/"
          debugBorders={DEBUG_OVERLAYS}
          handleRef={phoneArmRef}
          onPickUp={stopRing}
          onPhoneRaised={reportPhoneRaised}
          onPhoneDialled={reportPhoneDialled}
          onPhoneOutgoing={reportPhoneOutgoing}
          onPhoneAnswered={reportPhoneAnswered}
          onPhoneEnded={reportPhoneEnded}
          onPhoneMissed={reportPhoneMissed}
          onPhoneIncoming={reportPhoneIncoming}
          screenPos={{ top: '60%',  left: '37%', width: '30%', rotate: '0deg', rotateX: '0deg', rotateY: '0deg' }}
          keypadPos={{ top: '78%',  left: '35%', width: '36%', height: '10.5%', rotate: '-1deg', rotateX: '0deg', rotateY: '0deg' }}
          answerPos={{ bottom: '22%', left: '33%', width: '15%', height: '3%', rotate: '-1deg' }}
          endPos={{    bottom: '22.3%', left: '57%', width: '15%', height: '3%', rotate: '-1deg' }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ── PORTED PANELS ────────────────────────────────────────────────────
          ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Scenario panel (bottom-right) ── */}
      <div style={{ position: 'absolute', bottom: '5.5rem', right: '1.25rem', zIndex: 100, pointerEvents: 'auto', maxWidth: '320px' }}>

        {/* No active scenario — selector */}
        {!currentScenario && (
          <div style={{
            background: 'rgba(2,11,24,0.95)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem', overflow: 'hidden', backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontFamily: MONO_FONT, fontSize: '0.6rem', letterSpacing: '0.2em', color: '#e2e8f0', fontWeight: 700 }}>EMERGENCY SCENARIOS</span>
              <button onClick={() => setScenarioPanelOpen(v => !v)} style={{
                fontFamily: MONO_FONT, fontSize: '0.6rem', color: '#475569',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>{scenarioPanelOpen ? '▾' : '▸'}</button>
            </div>
            {scenarioPanelOpen && (
              <div style={{ padding: '0.5rem' }}>
                {SCENARIOS.map(s => (
                  <button key={s.id} onClick={() => startScenario(s)} style={{
                    width: '100%', textAlign: 'left', padding: '0.5rem 0.6rem',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.25rem', marginBottom: '0.3rem', cursor: 'pointer',
                    fontFamily: MONO_FONT, color: '#cbd5e1', fontSize: '0.6rem', letterSpacing: '0.1em',
                    transition: 'all 0.15s',
                  }}>
                    {s.name}
                    <div style={{ fontSize: '0.42rem', color: '#475569', marginTop: '2px', letterSpacing: '0.05em' }}>{s.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active scenario checklist */}
        {currentScenario && !showResults && (
          <div style={{
            background: 'rgba(2,11,24,0.95)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem', overflow: 'hidden', backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: '70vh',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.03)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: MONO_FONT, fontSize: '0.65rem', color: '#e2e8f0', fontWeight: 700, letterSpacing: '0.1em' }}>{currentScenario.name.toUpperCase()}</div>
                <div style={{ fontFamily: MONO_FONT, fontSize: '0.42rem', color: '#475569', marginTop: '2px' }}>{currentScenario.description}</div>
              </div>
              <button onClick={() => setShowResults(true)} style={{
                marginLeft: '0.5rem', padding: '0.2rem 0.5rem',
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                color: '#fbbf24', fontFamily: MONO_FONT, fontSize: '0.45rem',
                borderRadius: '0.2rem', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>RESULTS</button>
            </div>

            {/* Checklist */}
            <div style={{ overflowY: 'auto', padding: '0.5rem 0.75rem', flex: 1 }}>
              {checklist.map((item, idx) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  {/* Checkbox */}
                  <svg viewBox="0 0 20 20" width="14" height="14" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <path d="M3 3 L17 3 L17 17 L3 17 Z" fill="none" stroke={item.completed ? '#38bdf8' : '#334155'} strokeWidth="1.5" />
                    {item.completed && <path d="M5 10 L9 14 L16 6" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontFamily: MONO_FONT, fontSize: '0.55rem',
                      color: item.completed ? '#475569' : '#cbd5e1',
                      textDecoration: item.completed ? 'line-through' : 'none',
                    }}>{idx + 1}. {item.action}</span>
                    {item.completed && item.timeCompleted && scenarioStartTime && (
                      <span style={{ fontFamily: MONO_FONT, fontSize: '0.42rem', color: '#38bdf8', marginLeft: '0.35rem' }}>
                        +{((item.timeCompleted - scenarioStartTime) / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {scenarioComplete && (
              <div style={{
                margin: '0.5rem', padding: '0.5rem',
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.4)',
                borderRadius: '0.25rem', textAlign: 'center',
                fontFamily: MONO_FONT, fontSize: '0.6rem', color: '#34d399', letterSpacing: '0.15em',
              }}>✓ SCENARIO COMPLETE</div>
            )}
          </div>
        )}

        {/* Results panel */}
        {showResults && currentScenario && (() => {
          const p = calculatePerformance();
          return p ? (
            <div style={{
              background: 'rgba(2,11,24,0.97)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem', overflow: 'hidden', backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: '75vh',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ fontFamily: MONO_FONT, fontSize: '0.65rem', color: '#e2e8f0', fontWeight: 700, letterSpacing: '0.2em' }}>SCENARIO RESULTS</span>
                <button onClick={() => { setShowResults(false); setCurrentScenario(null); setActionLog([]); setChecklist([]); setLightsLevel(1); }} style={{
                  padding: '0.2rem 0.5rem', background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444',
                  fontFamily: MONO_FONT, fontSize: '0.45rem', borderRadius: '0.2rem', cursor: 'pointer',
                }}>CLOSE</button>
              </div>
              <div style={{ overflowY: 'auto', padding: '0.6rem 0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  {[
                    { label: 'TOTAL TIME',  value: `${p.totalTime.toFixed(1)}s` },
                    { label: 'SCORE',        value: `${p.score.toFixed(0)}%` },
                    { label: 'ACTIONS',      value: `${p.completedActions} / ${p.totalActions}` },
                    { label: 'CORRECT ORDER', value: p.correctOrder ? '✓ YES' : '✗ NO', accent: p.correctOrder ? '#34d399' : '#ef4444' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '0.25rem', padding: '0.5rem',
                    }}>
                      <div style={{ fontFamily: MONO_FONT, fontSize: '0.42rem', color: '#475569', letterSpacing: '0.1em' }}>{stat.label}</div>
                      <div style={{ fontFamily: MONO_FONT, fontSize: '1rem', color: stat.accent ?? '#e2e8f0', fontWeight: 700, marginTop: '2px' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontFamily: MONO_FONT, fontSize: '0.5rem', color: '#475569', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>ACTION LOG</div>
                {actionLog.map((log, idx) => (
                  <div key={idx} style={{
                    padding: '0.4rem 0.5rem', borderRadius: '0.2rem', marginBottom: '0.25rem',
                    background: log.correct ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)',
                    borderLeft: `3px solid ${log.correct ? '#34d399' : '#334155'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: MONO_FONT, fontSize: '0.55rem', color: '#cbd5e1' }}>{log.action}</span>
                      <span style={{ fontFamily: MONO_FONT, fontSize: '0.42rem', color: '#475569', marginLeft: '0.5rem', flexShrink: 0 }}>
                        {scenarioStartTime ? `+${((log.timestamp - scenarioStartTime) / 1000).toFixed(1)}s` : ''}
                      </span>
                    </div>
                    <div style={{ fontFamily: MONO_FONT, fontSize: '0.42rem', color: '#475569', marginTop: '2px' }}>
                      {log.location} • #{log.actualOrder}{log.expectedOrder ? ` (expected #${log.expectedOrder})` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}
      </div>

      {/* ── Logbook button (appears near sbLogbook node, but accessible always) ── */}
      <LogbookButton onClick={() => { setShowLogbook(true); logAction('Open deck log', 'logbook'); }} />

      {/* ── Logbook modal ── */}
      {showLogbook && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setShowLogbook(false)}>
          <div
            style={{ position: 'relative', width: '100%', maxWidth: '1300px', height: '90vh', background: 'white', border: '4px solid black', boxShadow: '0 0 60px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>

            {/* Logbook header */}
            <div style={{ background: 'white', borderBottom: '4px solid black', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif', fontSize: '1.25rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.5rem' }}>SHIP'S DECK LOG SHEET</h1>
                  <div style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif', fontSize: '0.65rem', textAlign: 'right' }}>
                    Vessel Name: MV Soho<br />IMO: 16348275<br />Callsign: D1WX7
                  </div>
                </div>
                <button onClick={() => setShowLogbook(false)} style={{
                  marginLeft: '1rem', width: '32px', height: '32px', background: '#b91c1c',
                  border: '2px solid #ef4444', color: 'white', borderRadius: '50%',
                  fontFamily: 'var(--font-manrope), system-ui, sans-serif', fontSize: '1.2rem', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
              </div>

              {/* Ship info row */}
              <div style={{ border: '2px solid black', padding: '0.35rem', fontFamily: 'var(--font-manrope), system-ui, sans-serif', fontSize: '0.65rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>USE BLACK INK TO FILL IN THIS LOG</div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {(['shipType', 'hullNumber'] as const).map(field => (
                    <div key={field} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <span>{field === 'shipType' ? 'SHIP TYPE:' : 'HULL NUMBER:'}</span>
                      <input type="text" value={shipInfo[field]} onChange={e => setShipInfo(p => ({ ...p, [field]: e.target.value }))}
                        style={{ border: '1px solid black', padding: '0 4px', width: '80px', fontFamily: 'inherit', fontSize: 'inherit' }} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <span>DATE:</span>
                    {(['date', 'month', 'year'] as const).map(f => (
                      <input key={f} type="text" value={shipInfo[f]}
                        onChange={e => setShipInfo(p => ({ ...p, [f]: e.target.value }))}
                        placeholder={f === 'year' ? 'YYYY' : f === 'month' ? 'MM' : 'DD'}
                        style={{ border: '1px solid black', padding: '0 4px', textAlign: 'center', width: f === 'year' ? '56px' : '40px', fontFamily: 'inherit', fontSize: 'inherit' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '72px 80px 80px 72px 100px 1fr', border: '2px solid black', fontFamily: 'var(--font-manrope), system-ui, sans-serif', fontSize: '0.6rem', fontWeight: 700, background: '#f3f4f6' }}>
                {['TIME', 'HEADING', 'SPEED', 'DEPTH', 'VISIBILITY', 'RECORD OF ALL EVENTS OF THE DAY'].map(h => (
                  <div key={h} style={{ borderRight: '1px solid black', padding: '4px', textAlign: 'center' }}>{h}</div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
              {logEntries.map((entry, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '72px 80px 80px 72px 100px 1fr', borderBottom: '1px solid black', fontFamily: 'var(--font-manrope), system-ui, sans-serif', fontSize: '0.6rem' }}>
                  {(['time', 'heading', 'speed', 'depth', 'visibility'] as const).map(field => (
                    <input key={field} type="text" value={entry[field]}
                      onChange={e => updateLogEntry(i, field, e.target.value)}
                      style={{ borderRight: '1px solid black', padding: '4px', textAlign: 'center', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit' }} />
                  ))}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input type="text" value={entry.event}
                      onChange={e => updateLogEntry(i, 'event', e.target.value)}
                      placeholder="Enter event description..."
                      style={{ width: '100%', padding: '4px 28px 4px 4px', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 'inherit' }} />
                    <button onClick={() => deleteLogEntry(i)} style={{
                      position: 'absolute', right: '4px', background: '#ef4444', color: 'white',
                      border: 'none', borderRadius: '2px', padding: '1px 6px', fontSize: '0.55rem',
                      cursor: 'pointer', opacity: 0.7,
                    }}>×</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ background: 'white', borderTop: '4px solid black', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
              <button onClick={addLogEntry} style={{
                background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '4px',
                padding: '0.4rem 0.9rem', fontFamily: 'var(--font-manrope), system-ui, sans-serif', fontWeight: 700,
                fontSize: '0.7rem', cursor: 'pointer',
              }}>+ ADD NEW ENTRY</button>
              <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>{logEntries.length} entries</span>
              <span style={{ fontSize: '0.6rem' }}>OPNAV 3109/09 (Rev. 7-64)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes alarmFlash { 0%,100%{opacity:0} 50%{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
    </div>
  );
}

// ── Logbook floating button ────────────────────────────────────────────────────

function LogbookButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', bottom: '5.5rem',
      left: '50%', transform: 'translateX(calc(-50% + 180px))',
      zIndex: 100, pointerEvents: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
      background: 'rgba(2,11,24,0.92)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '0.5rem', padding: '0.6rem 0.9rem',
      backdropFilter: 'blur(16px)', cursor: 'pointer',
    }}>
      <span style={{ fontSize: '1.2rem' }}>📋</span>
      <span style={{ fontFamily: MONO_FONT, fontSize: '0.45rem', letterSpacing: '0.2em', color: '#475569' }}>LOGBOOK</span>
    </button>
  );
}

// ── Reusable top-button style helper ─────────────────────────────────────────

function topBtnStyle(color: string, bg: string, borderColor: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: bg, border: `1px solid ${borderColor}`,
    borderRadius: '0.375rem', padding: '0.45rem 0.85rem',
    backdropFilter: 'blur(12px)', color,
    fontFamily: MONO_FONT, fontSize: '0.6rem', letterSpacing: '0.2em',
    cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none',
  };
}