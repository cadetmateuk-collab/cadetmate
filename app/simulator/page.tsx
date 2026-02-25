'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Scene = 'port' | 'center' | 'starboard';

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
  location: Scene;
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
  location: Scene;
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

interface Hotspot {
  id: string;
  position: { left: string; top: string; width: string; height: string };
  popupImage?: string;
  label?: string;
  action?: string;
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

// ─── Audio Helpers ────────────────────────────────────────────────────────────

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.08,
  type: OscillatorType = 'sine'
) {
  const osc = ctx.createOscillator();
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShipBridgeSimulator() {
  // Scene
  const [currentScene, setCurrentScene] = useState<Scene>('center');
  const [isFading, setIsFading] = useState(false);

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Alarms
  const [alarmActive, setAlarmActive] = useState(false);
  const [phoneRinging, setPhoneRinging] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<string | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ship animation
  const [shipProgress, setShipProgress] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Popups
  const [activePopup, setActivePopup] = useState<string | null>(null);

  // Scenario system
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [scenarioStartTime, setScenarioStartTime] = useState<number | null>(null);
  const [actionLog, setActionLog] = useState<ActionLog[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [scenarioComplete, setScenarioComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Visual effects
  const [lightsLevel, setLightsLevel] = useState(1);

  // VHF chatter
  const [vhfChatterEnabled, setVhfChatterEnabled] = useState(true);
  const vhfPlayingRef = useRef(false);
  const vhfTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vhfAudioRef = useRef<HTMLAudioElement | null>(null);

  // Radio / PTT
  const [isRecording, setIsRecording] = useState(false);
  const [radioTranscript, setRadioTranscript] = useState('');
  const [radioStatus, setRadioStatus] = useState<'idle' | 'listening' | 'processing' | 'responding'>('idle');
  const [lastBosunResponse, setLastBosunResponse] = useState('');
  const [aiProcessingStatus, setAiProcessingStatus] = useState('');
  const recognitionRef = useRef<unknown>(null);
  const radioAudioRef = useRef<HTMLAudioElement | null>(null);
  const [openaiApiKey] = useState(process.env.NEXT_PUBLIC_OPENAI_API_KEY || '');
  const [useAI] = useState(!!process.env.NEXT_PUBLIC_OPENAI_API_KEY);

  // Lookout
  const [lookoutPosition, setLookoutPosition] = useState<Scene>('center');
  const [showLookoutArrows, setShowLookoutArrows] = useState(false);
  const [lookoutTransitioning, setLookoutTransitioning] = useState(false);
  const [lookoutExitDirection, setLookoutExitDirection] = useState<'left' | 'right' | null>(null);

  // Ambient
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const ambientCleanupRef = useRef<(() => void) | null>(null);

  // Phone panel
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [dialingContact, setDialingContact] = useState<string | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Logbook
  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    { time: '1100', heading: '120 deg', speed: '15.6 kts', depth: '62.8m', visibility: 'Clear', event: "Hourly Position 45° 34.8′ N 22° 03.6′ W" },
    { time: '1200', heading: '130 deg', speed: '15.0kts', depth: '100.1m', visibility: 'Clear', event: "Noon Position 46° 12.4′ N 23° 01.2′ W Compass Error 3 E, Wind Force 5, Direction 235, Sea State 4, Swell 3, Visibility 12NM, Barometer 1001, Temp +19" },
    { time: '1207', heading: '131 deg', speed: '15.1kts', depth: '98.6m', visibility: 'Clear', event: "Watch Handover Completed to Deck Cadet" },
  ]);
  const [shipInfo, setShipInfo] = useState(() => {
    const d = new Date();
    return {
      shipType: 'C.G.',
      hullNumber: '',
      date: d.getDate().toString().padStart(2, '0'),
      month: (d.getMonth() + 1).toString().padStart(2, '0'),
      year: d.getFullYear().toString(),
    };
  });

  // ─── Parallax / Head-movement ───────────────────────────────────────────────
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const PARALLAX_MAX_PX = 18;
  const PARALLAX_SCALE = 1.07;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    setMousePos({
      x: (e.clientX / clientWidth) - 0.5,
      y: (e.clientY / clientHeight) - 0.5,
    });
  }, []);

  // ─── Audio Context ──────────────────────────────────────────────────────────

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // ─── Static Data ────────────────────────────────────────────────────────────

  const sceneLabels: Record<Scene, string> = useMemo(() => ({
    port: 'Port Wing',
    center: 'Center Bridge',
    starboard: 'Starboard Wing',
  }), []);

  const bridgeMedia: Record<Scene, { type: 'video' | 'image'; src: string }> = useMemo(() => ({
    port: { type: 'image', src: '/shipimages/PS-Wing.png' },
    center: { type: 'image', src: '/shipimages/bridge.png' },
    starboard: { type: 'image', src: '/shipimages/SBWind.png' },
  }), []);

  const hotspots: Record<Scene, Hotspot[]> = useMemo(() => ({
    center: [
      { id: 'radar', position: { left: '62%', top: '55%', width: '15%', height: '20%' }, popupImage: '/shipimages/celest.jpeg', label: 'Radar Console', action: 'check-radar' },
      { id: 'logbook', position: { left: '65%', top: '72%', width: '15%', height: '15%' }, label: 'Logbook', action: 'open-logbook' },
      { id: 'helm', position: { left: '40%', top: '60%', width: '10%', height: '15%' }, popupImage: '/shipimages/helm-closeup.png', label: 'Helm Controls', action: 'check-helm' },
      { id: 'ecdis', position: { left: '24%', top: '55%', width: '15%', height: '20%' }, popupImage: '/shipimages/ecdis.png', label: 'ECDIS', action: 'check-ecdis' },
      { id: 'vhf-radio', position: { left: '78%', top: '48%', width: '8%', height: '12%' }, label: 'VHF Radio', action: 'use-vhf' },
      { id: 'engine-telegraph', position: { left: '48%', top: '65%', width: '6%', height: '10%' }, label: 'Engine Telegraph', action: 'adjust-engine' },
    ],
    port: [
      { id: 'port-lookout', position: { left: '20%', top: '40%', width: '30%', height: '25%' }, popupImage: '/shipimages/port-view-closeup.png', label: 'Port Lookout', action: 'port-lookout' },
      { id: 'lifebuoy-port', position: { left: '15%', top: '70%', width: '10%', height: '15%' }, label: 'Life Buoy', action: 'deploy-lifebuoy-port' },
    ],
    starboard: [
      { id: 'deploy-lifebuoy-starboard', position: { left: '50%', top: '60%', width: '20%', height: '25%' }, label: 'Life Buoy', action: 'deploy-lifebuoy-starboard' },
    ],
  }), []);

  const phoneContacts: PhoneContact[] = useMemo(() => [
    { id: 'master', buttonId: 'phone-master', name: 'MASTER', title: 'Capt. R. Voss', extension: '501', icon: '🎖️', audioFile: '/audio/phone/master_response.wav' },
    { id: 'ecr', buttonId: 'phone-ecr', name: 'ENGINE CONTROL ROOM', title: 'Ch. Eng. M. Santos', extension: '301', icon: '⚙️', audioFile: '/audio/phone/ecr_response.wav' },
    { id: 'chief-officer', buttonId: 'phone-chief-officer', name: 'CHIEF OFFICER', title: '1st Off. K. Brennan', extension: '502', icon: '📋', audioFile: '/audio/phone/chief_officer_response.wav' },
    { id: 'security', buttonId: 'phone-security', name: 'SECURITY', title: 'Security Officer', extension: '601', icon: '🔒', audioFile: '/audio/phone/security_response.wav' },
  ], []);

  const scenarios = useMemo<Scenario[]>(() => [
    {
      id: 'man-overboard', name: 'Man Overboard',
      description: 'Crew member has fallen overboard. Execute immediate rescue procedures.',
      timeLimit: 300,
      events: [{ id: 'mob-phone', type: 'alarm', trigger: 'immediate', data: { active: true, type: 'phone' } }],
      checklist: [
        { id: 'mob-1', action: 'Answer emergency phone', location: 'center', buttonId: 'answer-phone-btn', order: 1, completed: false },
        { id: 'mob-2', action: 'Activate GPS MOB Function', location: 'center', buttonId: 'ecdis', order: 2, completed: false },
        { id: 'mob-3', action: 'Deploy starboard bridge wing life buoy', location: 'starboard', buttonId: 'deploy-lifebuoy-starboard', order: 3, completed: false },
        { id: 'mob-4', action: "Sound ship's MOB alarm", location: 'center', buttonId: 'alarm-mob', order: 4, completed: false },
        { id: 'mob-5', action: 'Call Master', location: 'center', buttonId: 'phone-master', order: 5, completed: false },
        { id: 'mob-6', action: 'Inform ECR', location: 'center', buttonId: 'phone-ecr', order: 6, completed: false },
        { id: 'mob-7', action: 'Post lookout on starboard wing', location: 'starboard', buttonId: 'starboard-lookout', order: 7, completed: false },
        { id: 'mob-8', action: 'Reduce speed', location: 'center', buttonId: 'helm', order: 8, completed: false },
      ],
    },
    {
      id: 'blackout', name: 'Total Blackout',
      description: 'Complete power failure. Restore emergency systems and ensure vessel safety.',
      timeLimit: 600,
      events: [
        { id: 'blackout-lights', type: 'lighting', trigger: 'immediate', data: { level: 0.1 } },
        { id: 'blackout-alarm', type: 'alarm', trigger: 'delayed', delay: 2000, data: { active: true } },
        { id: 'restore-lights', type: 'lighting', trigger: 'delayed', delay: 5000, data: { level: 0.3 } },
      ],
      checklist: [
        { id: 'bo-1', action: 'Acknowledge blackout alarm', location: 'center', buttonId: 'silence-alarm-btn', order: 1, completed: false },
        { id: 'bo-2', action: 'Check radar for traffic', location: 'center', buttonId: 'radar', order: 2, completed: false },
        { id: 'bo-3', action: 'Switch to manual steering', location: 'center', buttonId: 'helm', order: 3, completed: false },
        { id: 'bo-4', action: 'Verify position on ECDIS backup', location: 'center', buttonId: 'ecdis', order: 4, completed: false },
        { id: 'bo-5', action: 'Post lookouts port and starboard', location: 'port', buttonId: 'port-lookout', order: 5, completed: false },
        { id: 'bo-6', action: 'Verify starboard lookout posted', location: 'starboard', buttonId: 'starboard-lookout', order: 6, completed: false },
        { id: 'bo-7', action: 'Make Pan-Pan call on VHF', location: 'center', buttonId: 'vhf-radio', order: 7, completed: false },
        { id: 'bo-8', action: 'Log blackout in deck log', location: 'center', buttonId: 'logbook', order: 8, completed: false },
      ],
    },
    {
      id: 'fire-alarm', name: 'Fire in Engine Room',
      description: 'Fire detected in engine room. Implement fire response procedures.',
      timeLimit: 420,
      events: [{ id: 'fire-alarm', type: 'alarm', trigger: 'immediate', data: { active: true } }],
      checklist: [
        { id: 'fire-1', action: 'Sound general alarm', location: 'center', buttonId: 'silence-alarm-btn', order: 1, completed: false },
        { id: 'fire-2', action: 'Check ECDIS position', location: 'center', buttonId: 'ecdis', order: 2, completed: false },
        { id: 'fire-3', action: 'Stop engines', location: 'center', buttonId: 'engine-telegraph', order: 3, completed: false },
        { id: 'fire-4', action: 'Make Mayday call', location: 'center', buttonId: 'vhf-radio', order: 4, completed: false },
        { id: 'fire-5', action: 'Prepare to abandon ship - check port side', location: 'port', buttonId: 'port-lookout', order: 5, completed: false },
        { id: 'fire-6', action: 'Check starboard evacuation route', location: 'starboard', buttonId: 'starboard-lookout', order: 6, completed: false },
        { id: 'fire-7', action: 'Log emergency in deck log', location: 'center', buttonId: 'logbook', order: 7, completed: false },
      ],
    },
    {
      id: 'collision-avoidance', name: 'Collision Avoidance',
      description: 'Vessel on collision course detected. Execute evasive maneuvers.',
      timeLimit: 180,
      events: [{ id: 'collision-alarm', type: 'alarm', trigger: 'delayed', delay: 3000, data: { active: true } }],
      checklist: [
        { id: 'col-1', action: 'Check radar for CPA/TCPA', location: 'center', buttonId: 'radar', order: 1, completed: false },
        { id: 'col-2', action: 'Verify position on ECDIS', location: 'center', buttonId: 'ecdis', order: 2, completed: false },
        { id: 'col-3', action: 'Execute starboard turn', location: 'center', buttonId: 'helm', order: 3, completed: false },
        { id: 'col-4', action: 'Sound 5 short blasts', location: 'center', buttonId: 'silence-alarm-btn', order: 4, completed: false },
        { id: 'col-5', action: 'Call other vessel on VHF Ch 16', location: 'center', buttonId: 'vhf-radio', order: 5, completed: false },
        { id: 'col-6', action: 'Post lookout on starboard wing', location: 'starboard', buttonId: 'starboard-lookout', order: 6, completed: false },
        { id: 'col-7', action: 'Log incident', location: 'center', buttonId: 'logbook', order: 7, completed: false },
      ],
    },
  ], []);

  // ─── Log helpers ────────────────────────────────────────────────────────────

  const addEventToLog = useCallback((event: string) => {
    setLogEntries(prev => [...prev, {
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      heading: '', speed: '', depth: '', visibility: '', event,
    }]);
  }, []);

  // ─── Action logging ─────────────────────────────────────────────────────────

  const logAction = useCallback((action: string, buttonId: string) => {
    if (!currentScenario) return;
    const timestamp = Date.now();

    setActionLog(prev => {
      const checklistItem = checklist.find(item => item.buttonId === buttonId);
      return [...prev, {
        timestamp, action, location: currentScene,
        correct: checklistItem ? !checklistItem.completed : false,
        expectedOrder: checklistItem?.order,
        actualOrder: prev.length + 1,
      }];
    });

    setChecklist(prev => {
      const item = prev.find(i => i.buttonId === buttonId);
      if (!item || item.completed) return prev;
      const updated = prev.map(i => i.id === item.id ? { ...i, completed: true, timeCompleted: timestamp } : i);
      if (updated.every(i => i.completed)) setTimeout(() => {
        setScenarioComplete(true);
        setAlarmActive(false);
        addEventToLog(`Scenario "${currentScenario?.name}" completed`);
      }, 100);
      return updated;
    });
  }, [currentScenario, currentScene, checklist, addEventToLog]);

  // ─── Phone ──────────────────────────────────────────────────────────────────

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

  // ─── Scenario execution ─────────────────────────────────────────────────────

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
    const totalTime = (actionLog[actionLog.length - 1].timestamp - scenarioStartTime) / 1000;
    const correctOrder = actionLog.every(log => log.expectedOrder === undefined || log.expectedOrder === log.actualOrder);
    const completedActions = checklist.filter(i => i.completed).length;
    return { totalTime, correctOrder, completedActions, totalActions: checklist.length, score: (completedActions / checklist.length) * 100 };
  }, [currentScenario, scenarioStartTime, actionLog, checklist]);

  // ─── Alarm actions ──────────────────────────────────────────────────────────

  const silenceAlarm = useCallback(() => {
    setAlarmActive(false);
    logAction('Silence alarm', 'silence-alarm-btn');
  }, [logAction]);

  const answerPhone = useCallback(() => {
    setPhoneRinging(false);
    playAudioFile('/audio/mob.wav', 0.8);
    logAction('Answer emergency phone', 'answer-phone-btn');
  }, [logAction]);

  // ─── MOB Whistle ────────────────────────────────────────────────────────────

  const playMorseOscar = useCallback(() => {
    const ctx = ensureAudioCtx();
    const now = ctx.currentTime;
    const DASH = 1.5, GAP = 0.8;
    [0, 1, 2].forEach(i => {
      const t = now + i * (DASH + GAP);
      [180, 187].forEach(f => playTone(ctx, f, t, DASH, 0.4, 'sine'));
    });
    logAction('Sound Man Overboard alarm', 'alarm-mob');
    addEventToLog('Man Overboard alarm - Oscar signal sounded (--- --- ---)');
  }, [ensureAudioCtx, logAction, addEventToLog]);

  // ─── VHF Chatter ────────────────────────────────────────────────────────────

  const playVHFChatter = useCallback(() => {
    if (!vhfChatterEnabled || vhfPlayingRef.current) return;
    const files = ['/vhfchatter/chatter1.mp3', '/vhfchatter/chatter2.mp3'];
    const audio = new Audio(files[Math.floor(Math.random() * files.length)]);
    audio.volume = 0.3;
    vhfPlayingRef.current = true;
    vhfAudioRef.current = audio;
    const schedule = () => {
      vhfPlayingRef.current = false;
      vhfTimeoutRef.current = setTimeout(playVHFChatter, 30000);
    };
    audio.onended = schedule;
    audio.onerror = schedule;
    audio.play().catch(schedule);
  }, [vhfChatterEnabled]);

  // ─── Radio / PTT ────────────────────────────────────────────────────────────

  const playRadioResponse = useCallback((audioFile: string, desc: string) => {
    setRadioStatus('responding');
    setLastBosunResponse(desc);
    const audio = new Audio(audioFile);
    audio.volume = 0.8;
    const done = () => { setRadioStatus('idle'); radioAudioRef.current = null; };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
    radioAudioRef.current = audio;
  }, []);

  const processRadioMessage = useCallback(async (transcript: string) => {
    setRadioStatus('processing');
    const lower = transcript.toLowerCase();

    const bosunMap: Record<string, { file: string; desc: string }> = {
      '1': { file: '/audio/bosun/bsn_go_ahead.wav', desc: 'Go ahead' },
      '2': { file: '/audio/bosun/bsn_we_are_on_deck_now.wav', desc: 'We are on deck now' },
      '3': { file: '/audio/bosun/bsn_okay_copy.wav', desc: 'Okay, copy' },
      '4': { file: '/audio/bosun/bsn_understood_proceeding.wav', desc: 'Understood, proceeding' },
      '5': { file: '/audio/bosun/bsn_repeat_last_message.wav', desc: 'Repeat last message' },
      '6': { file: '/audio/bosun/bsn_wait_confirm_instruction.wav', desc: 'Wait, confirm instruction' },
      '7': { file: '/audio/bosun/bsn_fire_party_on_deck.wav', desc: 'Fire party on deck' },
      '8': { file: '/audio/bosun/bsn_fire_contained.wav', desc: 'Fire contained' },
      '9': { file: '/audio/bosun/bsn_fire_spreading_slightly.wav', desc: 'Fire spreading slightly' },
      '10': { file: '/audio/bosun/bsn_fire_main_deck_stbd_side.wav', desc: 'Fire on main deck starboard side' },
      '11': { file: '/audio/bosun/bsn_heavy_smoke_no_flame.wav', desc: 'Heavy smoke, no flame' },
      '12': { file: '/audio/bosun/bsn_hoses_charged.wav', desc: 'Hoses charged' },
      '13': { file: '/audio/bosun/bsn_replace_leaky_hose.wav', desc: 'Replace leaky hose' },
      '14': { file: '/audio/bosun/bsn_crew_safe_working_hard.wav', desc: 'Crew safe, working hard' },
      '15': { file: '/audio/bosun/bsn_no_injury_all_crew_accounted.wav', desc: 'No injury, all crew accounted' },
      '16': { file: '/audio/bosun/bsn_all_for_now_will_update.wav', desc: 'All for now, will update' },
      '17': { file: '/audio/bosun/bsn_anchor_clear_and_ready.wav', desc: 'Anchor clear and ready' },
      '18': { file: '/audio/bosun/bsn_mooring_line_chaffed_but_holding.wav', desc: 'Mooring line chaffed but holding' },
      '19': { file: '/audio/bosun/bsn_checking_for_hotspots.wav', desc: 'Checking for hotspots' },
      '20': { file: '/audio/bosun/bsn_slippery_deck.wav', desc: 'Slippery deck' },
      '21': { file: '/audio/bosun/bsn_need_more_light_on_deck.wav', desc: 'Need more light on deck' },
      '22': { file: '/audio/bosun/bsn_damage_railing.wav', desc: 'Damage to railing' },
      '23': { file: '/audio/bosun/bsn_fcastle_checked_no_flooding.wav', desc: 'Fcastle checked, no flooding' },
      '24': { file: '/audio/bosun/bsn_boundary_cooling_started.wav', desc: 'Boundary cooling started' },
      '25': { file: '/audio/bosun/bsn_cargo_lashing_loose_securing.wav', desc: 'Cargo lashing loose, securing' },
      '26': { file: '/audio/bosun/bsn_strong_wind_poor_vis.wav', desc: 'Strong wind, poor visibility' },
      '27': { file: '/audio/bosun/bsn_situation_under_control.wav', desc: 'Situation under control' },
      '28': { file: '/audio/bosun/bsn_situation_worsening.wav', desc: 'Situation worsening' },
      '29': { file: '/audio/bosun/bsn_please_advise_next_action.wav', desc: 'Please advise next action' },
    };

    const choose = (key: string) => {
      const r = bosunMap[key] ?? bosunMap['3'];
      setAiProcessingStatus('🔊 ' + r.desc);
      addEventToLog(`Radio: "${transcript}" → Bosun: "${r.desc}"`);
      playRadioResponse(r.file, r.desc);
      setTimeout(() => setAiProcessingStatus(''), 3000);
    };

    if (useAI && openaiApiKey) {
      try {
        setAiProcessingStatus('☁️ Sending to OpenAI...');
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a bosun. Choose the single best numbered response (1-29) for the bridge officer\'s message. Reply with only the number.' },
              { role: 'user', content: `Officer said: "${transcript}"\nResponse number:` },
            ],
            max_tokens: 5, temperature: 0.1,
          }),
        });
        const data = await res.json();
        choose(data.choices[0].message.content.trim());
      } catch {
        setAiProcessingStatus('❌ API Error - using fallback');
        choose('3');
      }
      return;
    }

    // Keyword fallback
    let key = '3';
    if ((lower.includes('bosun') || lower.includes('boson')) && (lower.includes('copy') || lower.includes('bridge') || lower.includes('come in'))) key = '1';
    else if (lower.includes('proceed') || lower.includes('go to') || lower.includes('move to') || lower.includes('head to')) key = '4';
    else if (lower.includes('repeat') || lower.includes('say again')) key = '5';
    else if (lower.includes('fire')) {
      if (lower.includes('contain') || lower.includes('out')) key = '8';
      else if (lower.includes('worse') || lower.includes('spread')) key = '9';
      else if (lower.includes('where') || lower.includes('location')) key = '10';
      else if (lower.includes('party') || lower.includes('team')) key = '7';
      else if (lower.includes('smoke')) key = '11';
      else key = '8';
    }
    else if (lower.includes('crew') || lower.includes('everyone')) key = lower.includes('injur') || lower.includes('hurt') ? '15' : '14';
    else if (lower.includes('situation') || lower.includes('status')) key = lower.includes('worse') ? '28' : '27';
    else if (lower.includes('anchor')) key = '17';
    else if (lower.includes('hose') || lower.includes('water')) key = lower.includes('leak') ? '13' : '12';
    else if (lower.includes('mooring') || lower.includes('line')) key = '18';
    else if (lower.includes('damage') || lower.includes('broken')) key = '22';
    else if (lower.includes('flood') || lower.includes('fcastle') || lower.includes('forecastle')) key = '23';
    else if (lower.includes('check') || lower.includes('hotspot')) key = '19';
    else if (lower.includes('weather') || lower.includes('wind') || lower.includes('visibility')) key = '26';
    else if (lower.includes('light') || lower.includes('dark')) key = '21';
    else if (lower.includes('cargo') || lower.includes('lash')) key = '25';
    else if (lower.includes('stand by') || lower.includes('standby')) key = '16';
    else if (lower.includes('what should') || lower.includes('advise') || lower.includes('next')) key = '29';

    choose(key);
  }, [useAI, openaiApiKey, playRadioResponse, addEventToLog]);

  const handlePTTPress = useCallback(() => {
    const rec = recognitionRef.current as { start: () => void } | null;
    if (!rec) { alert('Speech recognition not supported in this browser'); return; }
    ensureAudioCtx();
    playAudioFile('/audio/bleep.mp3', 0.6);
    setIsRecording(true);
    setRadioStatus('listening');
    setRadioTranscript('');
    try { rec.start(); } catch { setIsRecording(false); setRadioStatus('idle'); }
  }, [ensureAudioCtx]);

  const handlePTTRelease = useCallback(() => {
    const rec = recognitionRef.current as { stop: () => void } | null;
    if (rec && isRecording) try { rec.stop(); } catch { /* ignore */ }
    setIsRecording(false);
  }, [isRecording]);

  // ─── Lookout ────────────────────────────────────────────────────────────────

  const moveLookout = useCallback((direction: Scene) => {
    if (lookoutPosition === direction) return;
    setShowLookoutArrows(false);
    const order: Scene[] = ['port', 'center', 'starboard'];
    const exitDir = order.indexOf(direction) > order.indexOf(lookoutPosition) ? 'right' : 'left';
    setLookoutExitDirection(exitDir);
    setLookoutTransitioning(true);
    setTimeout(() => {
      setLookoutPosition(direction);
      setLookoutExitDirection(null);
      setTimeout(() => setLookoutTransitioning(false), 600);
    }, 600);
    if (direction === 'port') logAction('Post lookout on port wing', 'port-lookout');
    else if (direction === 'starboard') logAction('Post lookout on starboard wing', 'starboard-lookout');
  }, [lookoutPosition, logAction]);

  const getLookoutStyle = useCallback((): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', bottom: '0%', height: '100%', zIndex: 16, pointerEvents: lookoutTransitioning ? 'none' : 'auto', cursor: 'pointer' };
    const leftMap: Record<Scene, string> = { port: '10%', center: '5%', starboard: '70%' };
    if (lookoutTransitioning) {
      return { ...base, left: lookoutExitDirection === 'left' ? '-20%' : lookoutExitDirection === 'right' ? '120%' : leftMap[lookoutPosition], transition: 'left 0.6s ease-in-out' };
    }
    return { ...base, left: leftMap[lookoutPosition], transition: 'all 0.3s ease' };
  }, [lookoutPosition, lookoutTransitioning, lookoutExitDirection]);

  // ─── Hotspot click ──────────────────────────────────────────────────────────

  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    if (hotspot.action && hotspot.id !== 'logbook') logAction(hotspot.label || hotspot.action, hotspot.id);
    if (hotspot.popupImage || hotspot.id === 'logbook') setActivePopup(hotspot.id);
  }, [logAction]);

  // ─── Scene change ───────────────────────────────────────────────────────────

  const changeScene = useCallback((scene: Scene) => {
    setIsFading(true);
    setTimeout(() => setCurrentScene(scene), 150);
    setTimeout(() => setIsFading(false), 300);
  }, []);

  // ─── Ship position ──────────────────────────────────────────────────────────

  const getShipPosition = useCallback(() => {
    const offsets: Record<Scene, number> = { port: 27, center: 0, starboard: -27 };
    return `${50 + shipProgress * 0.5 + offsets[currentScene]}%`;
  }, [shipProgress, currentScene]);

  // ─── Logbook helpers ────────────────────────────────────────────────────────

  const addLogEntry = useCallback(() => {
    setLogEntries(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), heading: '', speed: '', depth: '', visibility: '', event: '' }]);
  }, []);

  const updateLogEntry = useCallback((i: number, field: keyof LogEntry, value: string) => {
    setLogEntries(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });
  }, []);

  const deleteLogEntry = useCallback((i: number) => {
    setLogEntries(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  // ─── Effects ────────────────────────────────────────────────────────────────

  // Ship animation
  useEffect(() => {
    const id = setInterval(() => setShipProgress((Date.now() - startTimeRef.current) / 1000 * 2), 50);
    return () => clearInterval(id);
  }, []);

  // Speech recognition init
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as unknown as { SpeechRecognition: unknown; webkitSpeechRecognition: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new (SR as new () => { continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onerror: unknown; onend: unknown })();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const t = e.results[0][0].transcript.toLowerCase();
      setRadioTranscript(t);
      processRadioMessage(t);
    };
    rec.onerror = () => { setRadioStatus('idle'); setIsRecording(false); };
    rec.onend = () => { setRadioStatus('idle'); setIsRecording(false); };
    recognitionRef.current = rec;
  }, [processRadioMessage]);

  // Alarm sound
  useEffect(() => {
    if (!alarmActive) return;
    const ctx = ensureAudioCtx();
    const id = setInterval(() => {
      const now = ctx.currentTime;
      playTone(ctx, 700, now, 0.45, 0.05, 'square');
      playTone(ctx, 800, now, 0.45, 0.05, 'sine');
    }, 700);
    alarmIntervalRef.current = id;
    return () => clearInterval(id);
  }, [alarmActive, ensureAudioCtx]);

  // Phone ring sound
  useEffect(() => {
    if (!phoneRinging) return;
    const ctx = ensureAudioCtx();
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

  // Ambient sound
  useEffect(() => {
    if (!ambientEnabled) { ambientCleanupRef.current?.(); return; }
    const ctx = ensureAudioCtx();
    const nodes: { stop: () => void }[] = [];

    const makeOsc = (type: OscillatorType, freq: number, vol: number, filterFreq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = type; osc.frequency.value = freq;
      filter.type = 'lowpass'; filter.frequency.value = filterFreq;
      gain.gain.value = vol;
      osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      osc.start();
      return osc;
    };

    nodes.push(makeOsc('sawtooth', 55, 0.03, 120));
    nodes.push(makeOsc('sawtooth', 82, 0.03, 200));

    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 800; nf.Q.value = 0.5;
    const ng = ctx.createGain(); ng.gain.value = 0.03;
    noise.connect(nf); nf.connect(ng); ng.connect(ctx.destination); noise.start();

    const makeCreak = () => {
      if (Math.random() > 0.5) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const flt = ctx.createBiquadFilter();
      osc.type = 'square';
      const sf = 180 + Math.random() * 120;
      osc.frequency.setValueAtTime(sf, now);
      osc.frequency.linearRampToValueAtTime(sf - 30 - Math.random() * 40, now + 0.3);
      flt.type = 'bandpass'; flt.frequency.value = 250; flt.Q.value = 2;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.connect(flt); flt.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.5);
    };

    const makeClank = () => {
      if (Math.random() > 0.6) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = 1200 + Math.random() * 400;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.2);
    };

    makeCreak();
    setTimeout(makeClank, 1000);
    const c1 = setInterval(makeCreak, 5000);
    const c2 = setInterval(makeClank, 7000);

    const cleanup = () => {
      nodes.forEach(n => { try { n.stop(); } catch { /* ignore */ } });
      try { noise.stop(); } catch { /* ignore */ }
      clearInterval(c1); clearInterval(c2);
    };
    ambientCleanupRef.current = cleanup;
    return cleanup;
  }, [ambientEnabled, ensureAudioCtx]);

  // VHF chatter
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      if (vhfTimeoutRef.current) clearTimeout(vhfTimeoutRef.current);
    };
  }, []);

  // ─── Parallax transform style ───────────────────────────────────────────────
  const parallaxStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `scale(${PARALLAX_SCALE}) translate(${-mousePos.x * PARALLAX_MAX_PX}px, ${-mousePos.y * PARALLAX_MAX_PX}px)`,
    transition: 'transform 0.12s ease-out',
    willChange: 'transform',
    transformOrigin: 'center center',
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-mono" onMouseMove={handleMouseMove}>

      {/* Lighting overlay */}
      <div className="absolute inset-0 bg-black z-[5] pointer-events-none transition-opacity duration-1000"
        style={{ opacity: 1 - lightsLevel }} />

      {/* Fade transition */}
      <div className={`absolute inset-0 bg-black z-50 pointer-events-none transition-opacity duration-150 ${isFading ? 'opacity-100' : 'opacity-0'}`} />

      {/* Audio init splash */}
      {!audioInitialized && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => { ensureAudioCtx(); setAudioInitialized(true); }}>
          <div className="border border-gray-600 rounded-lg p-10 text-center bg-gray-950">
            <div className="text-white text-2xl font-bold tracking-widest mb-2">SHIP BRIDGE SIMULATOR</div>
            <div className="text-gray-400 text-sm mb-6 tracking-wide">MARITIME TRAINING SYSTEM</div>
            <div className="text-4xl mb-4">🎧</div>
            <div className="text-gray-500 text-xs">Click anywhere to initialise audio</div>
          </div>
        </div>
      )}

      {/* ── PARALLAX WORLD WRAPPER ── */}
      <div style={parallaxStyle}>
        {/* Ocean background */}
        <div className="absolute inset-0 animate-ocean-motion">
          <div className="absolute inset-0 z-[1]" style={{ backgroundImage: "url('/shipimages/Ocean3.png')", backgroundSize: '100% auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center 35%' }} />
<div className="absolute inset-0 z-[2] animate-wave" style={{ backgroundImage: "url('/shipimages/ocean4.png')", backgroundSize: '100% auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center 35%' }} />
        </div>

        {/* Ship on horizon */}
        <div className="absolute top-[33%] left-0 w-full h-[20%] z-[3] pointer-events-none animate-ocean-motion">
          {shipProgress <= 120 && (
            <img src="/shipimages/pdv_stbd_over50m_underway_day.png" alt="Ship"
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: getShipPosition(), height: '50px', opacity: shipProgress > 100 ? 0 : 1 }} />
          )}
        </div>

        {/* Bridge scene */}
        {bridgeMedia[currentScene].type === 'video' ? (
          <video key="bridge-center"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full z-10 pointer-events-none object-contain object-bottom"
            src={bridgeMedia[currentScene].src} autoPlay loop muted playsInline />
        ) : (
          <div key={`bridge-${currentScene}`}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full z-10 pointer-events-none bg-contain bg-no-repeat"
            style={{ backgroundImage: `url('${bridgeMedia[currentScene].src}')`, backgroundPosition: 'center bottom' }} />
        )}

        {/* Hotspots */}
        {hotspots[currentScene].map(hotspot => (
          <div key={hotspot.id}
            onClick={() => handleHotspotClick(hotspot)}
            className="absolute z-[15] cursor-pointer pointer-events-auto group"
            style={{ left: hotspot.position.left, top: hotspot.position.top, width: hotspot.position.width, height: hotspot.position.height }}>
            <div className="absolute inset-0 border-2 border-yellow-400 bg-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
            {hotspot.label && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-3 py-1 bg-black/90 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {hotspot.label}
              </div>
            )}
          </div>
        ))}

        {/* Lookout */}
        {(lookoutPosition === currentScene || lookoutTransitioning) && (
          <div style={getLookoutStyle()}
            onMouseEnter={() => !lookoutTransitioning && setShowLookoutArrows(true)}
            onMouseLeave={() => setShowLookoutArrows(false)}>
            <img src="/shipimages/lookout.png" alt="Lookout"
              className={lookoutTransitioning ? 'animate-walk' : 'animate-idle-sway'}
              style={{ height: '100%', width: 'auto', objectFit: 'contain', transform: currentScene === 'starboard' ? 'scaleX(-1)' : 'none' }} />
            {showLookoutArrows && !lookoutTransitioning && (
              <div className="absolute top-35 left-53 -translate-x-1/2 flex gap-1 bg-black/80 border border-gray-600 rounded p-1 z-30">
                {(['port', 'center', 'starboard'] as Scene[]).map((s, i) => (
                  <button key={s} onClick={() => moveLookout(s)} disabled={lookoutPosition === s}
                    className="w-7 h-7 bg-gray-800 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-20 flex items-center justify-center text-base">
                    {i === 0 ? '←' : i === 1 ? '⚓' : '→'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* ── END PARALLAX WORLD WRAPPER ── */}

      {/* Phone ringing overlay */}
      {phoneRinging && currentScene === 'center' && (
        <>
          <div className="absolute inset-0 z-[15] pointer-events-none">
            <div className="absolute inset-0 bg-red-600/30 animate-flash" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl animate-pulse">📞</div>
          </div>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
            <button onClick={answerPhone}
              className="px-10 py-6 rounded-full text-xl font-bold bg-gradient-to-b from-green-600 to-green-800 border-4 border-green-900 text-white hover:from-green-500 active:scale-95 shadow-2xl tracking-wider animate-pulse"
              style={{ boxShadow: '0 0 30px rgba(34,197,94,0.8)' }}>
              📞 PICK UP PHONE
            </button>
          </div>
        </>
      )}

      {/* Silence alarm button */}
      {alarmActive && currentScene === 'center' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
          <button onClick={silenceAlarm}
            className="px-10 py-6 rounded-full text-xl font-bold bg-gradient-to-b from-red-600 to-red-800 border-4 border-red-900 text-white hover:from-red-500 active:scale-95 shadow-2xl tracking-wider"
            style={{ boxShadow: '0 0 30px rgba(220,38,38,0.8)', animation: 'pulse 1s ease-in-out infinite' }}>
            🔔 SILENCE ALARM
          </button>
        </div>
      )}

      {/* ── TOP: Scene navigation ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-8 pointer-events-auto">
        {(['port', 'center', 'starboard'] as Scene[]).map(scene => (
          <button key={scene} onClick={() => changeScene(scene)}
            className={`flex items-center gap-2 transition-all group ${currentScene === scene ? 'text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}>
            {scene === 'port' && <span className="text-2xl opacity-50 group-hover:opacity-100">←</span>}
            <span className="text-lg tracking-wider">{sceneLabels[scene].toUpperCase()}</span>
            {scene === 'starboard' && <span className="text-2xl opacity-50 group-hover:opacity-100">→</span>}
          </button>
        ))}
      </div>

      {/* ── TOP-LEFT: VHF toggle + test ── */}
      <div className="absolute top-5 left-5 z-20 flex gap-3">
        <button onClick={() => setVhfChatterEnabled(v => !v)}
          className="relative w-32 h-12 bg-gradient-to-b from-gray-800 to-gray-900 rounded-md shadow-lg border border-gray-700 pointer-events-auto overflow-hidden">
          <div className={`absolute inset-0 flex transition-all duration-300 ${vhfChatterEnabled ? 'translate-x-0' : 'translate-x-16'}`}>
            <div className="w-16 h-full bg-gradient-to-b from-green-600 to-green-700 flex items-center justify-center text-white text-xs font-bold">ON</div>
            <div className="w-16 h-full bg-gradient-to-b from-gray-600 to-gray-700 flex items-center justify-center text-white text-xs font-bold">OFF</div>
          </div>
          <div className={`absolute top-1 ${vhfChatterEnabled ? 'left-1' : 'left-[68px]'} w-14 h-10 bg-gradient-to-b from-gray-300 to-gray-400 rounded shadow-md transition-all border border-gray-500`} />
          <div className="absolute top-0 left-0 w-full text-center text-[9px] text-gray-400 mt-0.5">VHF CHATTER</div>
        </button>
        <button onClick={() => playVHFChatter()}
          className="w-20 h-12 bg-gradient-to-b from-gray-800 to-gray-900 rounded-md border border-gray-700 text-white text-[10px] hover:from-gray-700 pointer-events-auto">
          TEST<br />VHF
        </button>
      </div>

      {/* ── BOTTOM-LEFT: VHF Radio PTT ── */}
      <div className="absolute bottom-5 left-5 z-20 flex flex-col items-center pointer-events-auto">
        <button
          onMouseDown={handlePTTPress} onMouseUp={handlePTTRelease}
          onTouchStart={handlePTTPress} onTouchEnd={handlePTTRelease}
          disabled={radioStatus === 'responding'}
          className={`transition-all select-none ${isRecording ? 'scale-95' : 'scale-100 hover:scale-105'} ${radioStatus === 'responding' ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{ filter: isRecording ? 'drop-shadow(0 0 20px rgba(255,0,0,0.8))' : radioStatus === 'responding' ? 'drop-shadow(0 0 20px rgba(0,255,0,0.8))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
          <img src={radioStatus === 'responding' ? '/shipimages/uhf-bosun.png' : (radioStatus === 'listening' || radioStatus === 'processing') ? '/shipimages/uhf-transmitting.png' : '/shipimages/uhf-awaiting.png'}
            alt="VHF Radio" className="w-48 h-auto" />
        </button>
        <div className="text-center text-[10px] mt-2 text-gray-400">
          {isRecording ? '🔴 TRANSMITTING' : radioStatus === 'processing' ? '⚡ PROCESSING' : radioStatus === 'responding' ? '📻 RECEIVING' : 'HOLD TO TALK'}
        </div>
        {radioTranscript && (
          <div className="mt-2 p-2 bg-black/80 rounded border border-gray-700 max-w-[200px]">
            <div className="text-[9px] text-gray-500">YOU:</div>
            <div className="text-[10px] text-white truncate">"{radioTranscript}"</div>
            {lastBosunResponse && <>
              <div className="text-[9px] text-gray-500 mt-1">BOSUN:</div>
              <div className="text-[10px] text-green-400 truncate">"{lastBosunResponse}"</div>
            </>}
          </div>
        )}
        {aiProcessingStatus && <div className="mt-1 text-[9px] text-yellow-400">{aiProcessingStatus}</div>}
      </div>

      {/* ── BOTTOM-LEFT+: Phone button / panel ── */}
      {!phoneOpen ? (
        <button onClick={() => { setPhoneOpen(true); ensureAudioCtx(); }}
          className="absolute bottom-5 z-20 pointer-events-auto group"
          style={{ left: '220px' }}>
          <div className="relative w-16 h-16 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full border-4 border-gray-600 shadow-2xl flex items-center justify-center hover:from-gray-600 transition-all active:scale-95">
            <span className="text-2xl">☎️</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div className="text-center text-[9px] text-gray-400 mt-1 tracking-wider">PHONE</div>
        </button>
      ) : (
        <div className="absolute bottom-5 z-20 pointer-events-auto w-72" style={{ left: '210px' }}>
          <div className="bg-gradient-to-b from-gray-800 to-gray-950 border-2 border-gray-600 rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center">
              <div>
                <div className="text-white text-sm font-bold tracking-widest">INTERNAL COMMS</div>
                <div className="text-gray-400 text-[10px]">MV SOHO — BRIDGE EXT. 500</div>
              </div>
              <button onClick={() => { setPhoneOpen(false); endCall(); }}
                className="w-7 h-7 bg-gray-700 border border-gray-600 rounded text-gray-300 hover:bg-red-900 hover:text-white text-sm font-bold flex items-center justify-center">✕</button>
            </div>

            {(activeCall || dialingContact) && (() => {
              const c = phoneContacts.find(p => p.id === (activeCall || dialingContact));
              return c ? (
                <div className="bg-black/40 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className={`text-[10px] tracking-wider mb-0.5 ${dialingContact ? 'text-yellow-400' : 'text-green-400'}`}>
                      {dialingContact ? '⟳ DIALING...' : '● CONNECTED'}
                    </div>
                    <div className="text-white text-sm font-bold">{c.name}</div>
                    <div className="text-gray-400 text-[10px]">{c.title}</div>
                  </div>
                  {activeCall && (
                    <div className="text-right">
                      <div className="text-green-400 text-lg font-bold">{formatCallTime(callTimer)}</div>
                      <button onClick={endCall} className="mt-1 px-3 py-1 bg-red-700 border border-red-600 text-white text-[10px] rounded hover:bg-red-600">END CALL</button>
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            <div className="p-3 space-y-2">
              <div className="text-gray-500 text-[9px] tracking-widest px-1 mb-1">— SELECT STATION —</div>
              {phoneContacts.map(contact => {
                const isActive = activeCall === contact.id;
                const isDialing = dialingContact === contact.id;
                const isBusy = !!(activeCall && !isActive) || !!(dialingContact && !isDialing);
                return (
                  <button key={contact.id}
                    onClick={() => !isBusy && !isActive && !isDialing && makeCall(contact)}
                    disabled={isBusy || isActive || isDialing}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded border transition-all text-left ${
                      isActive ? 'bg-green-900/40 border-green-600 cursor-default' :
                      isDialing ? 'bg-yellow-900/30 border-yellow-700 cursor-wait' :
                      isBusy ? 'bg-gray-800/30 border-gray-800 opacity-40 cursor-not-allowed' :
                      'bg-gray-800/60 border-gray-700 hover:bg-gray-700/60 hover:border-gray-500 cursor-pointer'}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-400 animate-pulse' : isDialing ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-lg flex-shrink-0">{contact.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold tracking-wide truncate ${isActive ? 'text-green-300' : isDialing ? 'text-yellow-300' : 'text-gray-200'}`}>{contact.name}</div>
                      <div className="text-gray-500 text-[9px] truncate">{contact.title}</div>
                    </div>
                    <div className="text-gray-600 text-[9px] flex-shrink-0">ext.{contact.extension}</div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-800 px-4 py-2 flex justify-between items-center">
              <div className="text-gray-600 text-[9px]">HOLD TO TALK AFTER CONNECT</div>
              <div className={`text-[9px] ${activeCall ? 'text-green-500' : 'text-gray-700'}`}>{activeCall ? '● LINE OPEN' : '○ STANDBY'}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM-CENTER: Ship alarms ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-lg p-3 shadow-xl">
          <div className="text-white text-xs mb-2 text-center tracking-widest">SHIP ALARMS</div>
          <div className="flex gap-2">
            {[
              { id: 'alarm-mob', label: 'ALARM-MOB', sub: '- - -', action: () => { playMorseOscar(); setSelectedAlarm('alarm-mob'); setTimeout(() => setSelectedAlarm(null), 6000); } },
              { id: 'GENERAL', label: 'GENERAL', sub: '7 SHORT+1 LONG', action: () => { setAlarmActive(true); setSelectedAlarm('GENERAL'); setTimeout(() => { setSelectedAlarm(null); setAlarmActive(false); }, 5000); } },
              { id: 'FIRE', label: 'FIRE', sub: 'CONTINUOUS', action: () => { setAlarmActive(true); setSelectedAlarm('FIRE'); setTimeout(() => { setSelectedAlarm(null); setAlarmActive(false); }, 10000); addEventToLog('Fire alarm activated'); } },
            ].map(({ id, label, sub, action }) => (
              <button key={id} onClick={action}
                className={`px-4 py-2 rounded text-sm transition-all ${selectedAlarm === id ? 'bg-red-600 text-white border-2 border-red-400' : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'}`}>
                {label}<br /><span className="text-[10px]">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM-RIGHT: Scenario selector / checklist / results ── */}
      {!currentScenario && (
        <div className="absolute bottom-5 right-5 z-20 bg-gradient-to-b from-gray-900 to-black rounded-lg p-4 max-w-xs shadow-2xl border border-gray-700 pointer-events-auto">
          <h3 className="text-white text-lg font-bold mb-3 tracking-wider">EMERGENCY SCENARIOS</h3>
          <div className="space-y-2">
            {scenarios.map(s => (
              <button key={s.id} onClick={() => startScenario(s)}
                className="w-full px-4 py-3 bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-600 text-white rounded hover:from-gray-700 transition-all text-sm text-left shadow-md">
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentScenario && !showResults && (
        <div className="absolute bottom-5 right-5 z-20 max-w-md pointer-events-auto">
          <div className="relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-8 bg-gradient-to-b from-gray-400 to-gray-500 rounded-t-lg shadow-lg z-10 border-t-2 border-gray-300">
              <div className="absolute inset-1 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-md" />
            </div>
            <div className="bg-white rounded-sm shadow-2xl border border-gray-400 p-6 pt-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-gray-800 text-xl font-bold" style={{ fontFamily: 'Courier New, monospace' }}>{currentScenario.name}</h3>
                  <p className="text-gray-600 text-xs mt-1" style={{ fontFamily: 'Courier New, monospace' }}>{currentScenario.description}</p>
                </div>
                <button onClick={() => setShowResults(true)} className="px-2 py-1 bg-yellow-200 text-gray-800 text-xs rounded border border-yellow-400 hover:bg-yellow-300" style={{ fontFamily: 'Courier New, monospace' }}>Results</button>
              </div>
              <div className="border-b-2 border-gray-400 mb-3" />
              <div className="space-y-0 max-h-96 overflow-y-auto pr-2">
                {checklist.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-2 py-1" style={{ lineHeight: '32px' }}>
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      <svg viewBox="0 0 20 20" className="w-5 h-5">
                        <path d="M3 3 L17 3 L17 17 L3 17 Z" fill="none" stroke={item.completed ? '#333' : '#666'} strokeWidth="1.5" />
                        {item.completed && <path d="M5 10 L9 14 L16 6" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                      </svg>
                    </div>
                    <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`} style={{ fontFamily: 'Courier New, monospace' }}>
                      {idx + 1}. {item.action}
                    </span>
                    {item.completed && item.timeCompleted && scenarioStartTime && (
                      <span className="ml-1 text-xs text-blue-600" style={{ fontFamily: 'Courier New, monospace' }}>({((item.timeCompleted - scenarioStartTime) / 1000).toFixed(1)}s)</span>
                    )}
                  </div>
                ))}
              </div>
              {scenarioComplete && (
                <div className="mt-4 p-2 bg-green-100 border-2 border-green-600 rounded text-center">
                  <p className="text-green-800 font-bold" style={{ fontFamily: 'Courier New, monospace' }}>✓ SCENARIO COMPLETE</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showResults && currentScenario && (() => {
        const p = calculatePerformance();
        return p ? (
          <div className="absolute bottom-5 right-5 z-20 bg-gradient-to-b from-gray-900 to-black rounded-lg p-5 max-w-2xl max-h-[70vh] overflow-y-auto shadow-2xl border border-gray-700 pointer-events-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white text-xl font-bold tracking-wider">SCENARIO RESULTS</h3>
              <button onClick={() => { setShowResults(false); setCurrentScenario(null); setActionLog([]); setChecklist([]); }}
                className="px-4 py-2 bg-red-900 text-white rounded hover:bg-red-800 text-sm border border-red-700">CLOSE</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-800 p-4 rounded border border-gray-600">
                <div className="text-gray-400 text-xs mb-1">TOTAL TIME</div>
                <div className="text-white text-3xl font-bold">{p.totalTime.toFixed(1)}s</div>
              </div>
              <div className="bg-gray-800 p-4 rounded border border-gray-600">
                <div className="text-gray-400 text-xs mb-1">SCORE</div>
                <div className="text-white text-3xl font-bold">{p.score.toFixed(0)}%</div>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded border border-gray-600 mb-3">
              <div className="text-gray-400 text-xs mb-1">ACTIONS COMPLETED</div>
              <div className="text-white text-xl">{p.completedActions} / {p.totalActions}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded border border-gray-600 mb-3">
              <div className="text-gray-400 text-xs mb-1">CORRECT ORDER</div>
              <div className={`text-xl font-bold ${p.correctOrder ? 'text-green-400' : 'text-red-400'}`}>{p.correctOrder ? '✓ YES' : '✗ NO'}</div>
            </div>
            <h4 className="text-white font-bold mb-2 tracking-wider">ACTION LOG</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {actionLog.map((log, idx) => (
                <div key={idx} className={`p-3 rounded text-sm border-l-4 ${log.correct ? 'bg-green-900/20 border-green-500' : 'bg-gray-800/50 border-gray-600'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">{log.action}</div>
                      <div className="text-gray-400 text-xs mt-1">{log.location} • Order: #{log.actualOrder}{log.expectedOrder ? ` (Expected: #${log.expectedOrder})` : ''}</div>
                    </div>
                    <div className="text-gray-400 text-xs">{scenarioStartTime ? `+${((log.timestamp - scenarioStartTime) / 1000).toFixed(1)}s` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Logbook / equipment popups */}
      {activePopup && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center pointer-events-auto p-4"
          onClick={() => setActivePopup(null)}>
          {activePopup === 'logbook' ? (
            <div className="relative w-full max-w-[1400px] h-[90vh] bg-white border-4 border-black shadow-2xl flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="bg-white border-b-4 border-black p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-center mb-2">SHIP'S DECK LOG SHEET</h1>
                    <div className="text-xs text-right">Vessel Name: MV Soho<br />IMO: 16348275<br />Callsign: D1WX7</div>
                  </div>
                  <button onClick={() => setActivePopup(null)} className="ml-4 w-8 h-8 bg-red-700 border-2 border-red-500 text-white rounded-full hover:bg-red-600 font-bold text-xl">×</button>
                </div>
                <div className="border-2 border-black p-2 text-xs font-bold mb-2">
                  <div className="text-center mb-1">USE BLACK INK TO FILL IN THIS LOG</div>
                  <div className="flex gap-4 items-center justify-center">
                    {(['shipType', 'hullNumber'] as const).map(field => (
                      <div key={field} className="flex gap-1 items-center">
                        <span>{field === 'shipType' ? 'SHIP TYPE:' : 'HULL NUMBER:'}</span>
                        <input type="text" value={shipInfo[field]} onChange={e => setShipInfo(p => ({ ...p, [field]: e.target.value }))} className="border border-black px-1 w-24" />
                      </div>
                    ))}
                    <div className="flex gap-1 items-center">
                      <span>DATE:</span>
                      {(['date', 'month', 'year'] as const).map(f => (
                        <input key={f} type="text" value={shipInfo[f]} onChange={e => setShipInfo(p => ({ ...p, [f]: e.target.value }))}
                          className="border border-black px-1 text-center" style={{ width: f === 'year' ? '64px' : '48px' }}
                          placeholder={f === 'year' ? 'YYYY' : f === 'month' ? 'MM' : 'DD'} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[80px_80px_80px_80px_80px_1fr] border-2 border-black text-xs font-bold bg-gray-100">
                  {['TIME', 'HEADING', 'SPEED', 'DEPTH', 'VISIBILITY', 'RECORD OF ALL EVENTS OF THE DAY'].map(h => (
                    <div key={h} className="border-r border-black p-1 text-center last:border-r-0">{h}</div>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-white">
                {logEntries.map((entry, i) => (
                  <div key={i} className="grid grid-cols-[80px_80px_80px_80px_80px_1fr] border-b border-black text-xs hover:bg-gray-50 group">
                    {(['time', 'heading', 'speed', 'depth', 'visibility'] as const).map(field => (
                      <input key={field} type="text" value={entry[field]} onChange={e => updateLogEntry(i, field, e.target.value)}
                        className="border-r border-black p-1 text-center focus:bg-yellow-50 focus:outline-none" />
                    ))}
                    <div className="relative flex items-center">
                      <input type="text" value={entry.event} onChange={e => updateLogEntry(i, 'event', e.target.value)}
                        className="w-full p-1 pr-8 focus:bg-yellow-50 focus:outline-none" placeholder="Enter event description..." />
                      <button onClick={() => deleteLogEntry(i)}
                        className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded px-2 py-0.5 text-xs hover:bg-red-600">×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white border-t-4 border-black p-3 flex justify-between items-center">
                <button onClick={addLogEntry} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">+ ADD NEW ENTRY</button>
                <div className="text-xs text-gray-600">{logEntries.length} entries • Clears on refresh</div>
                <div className="text-xs">OPNAV 3109/09 (Rev. 7-64)</div>
              </div>
            </div>
          ) : (
            <div className="relative max-w-[90vw] max-h-[90vh] bg-[rgba(0,40,60,0.95)] border-4 border-[#00d9ff] rounded-lg p-4 shadow-[0_0_30px_rgba(0,217,255,0.6)]"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setActivePopup(null)} className="absolute top-2 right-2 w-10 h-10 bg-red-700 border-2 border-red-500 text-white rounded-full hover:bg-red-600 font-bold text-xl z-[101]">×</button>
              <img src={hotspots[currentScene].find(h => h.id === activePopup)?.popupImage} alt="Control" className="max-w-full max-h-[80vh] object-contain rounded" />
              {hotspots[currentScene].find(h => h.id === activePopup)?.label && (
                <div className="mt-4 text-center text-[#00d9ff] text-xl font-bold">{hotspots[currentScene].find(h => h.id === activePopup)?.label}</div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes wave { 0%,100%{opacity:0} 50%{opacity:1} }
        @keyframes flash { 0%,100%{opacity:0} 50%{opacity:0.7} }
        @keyframes oceanMotion {
          0%{transform:translate(0,0) rotate(0deg)}
          25%{transform:translate(2.5px,-5px) rotate(0.25deg)}
          50%{transform:translate(3px,-6px) rotate(0.3deg)}
          75%{transform:translate(1px,-2px) rotate(0.1deg)}
          100%{transform:translate(0,0) rotate(0deg)}
        }
        @keyframes idleSway {
          0%,100%{translate:0 0;rotate:0deg}
          25%{translate:0 -2px;rotate:0.3deg}
          75%{translate:0 -1px;rotate:-0.3deg}
        }
        @keyframes walk {
          0%,100%{translate:0 0} 25%,75%{translate:0 -4px}
        }
        .animate-wave{animation:wave 4s cubic-bezier(.45,.05,.55,.95) infinite}
        .animate-flash{animation:flash 1s ease-in-out infinite}
        .animate-ocean-motion{animation:oceanMotion 6s linear infinite;will-change:transform}
        .animate-idle-sway{animation:idleSway 3s ease-in-out infinite}
        .animate-walk{animation:walk .4s ease-in-out infinite}
      `}</style>
    </div>
  );
}