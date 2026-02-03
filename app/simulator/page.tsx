'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

type Scene = 'port' | 'center' | 'starboard';

// Logbook entry structure
interface LogEntry {
  time: string;
  heading: string;
  speed: string;
  depth: string;
  visibility: string;
  event: string;
}

// Action log structure
interface ActionLog {
  timestamp: number;
  action: string;
  location: Scene;
  correct: boolean;
  expectedOrder?: number;
  actualOrder: number;
}

// Scenario event structure
interface ScenarioEvent {
  id: string;
  type: 'alarm' | 'visual' | 'ship_movement' | 'lighting' | 'sound';
  trigger: 'immediate' | 'delayed';
  delay?: number;
  data: any;
}

// Checklist item structure
interface ChecklistItem {
  id: string;
  action: string;
  location: Scene;
  buttonId: string;
  order: number;
  completed: boolean;
  timeCompleted?: number;
}

// Scenario structure
interface Scenario {
  id: string;
  name: string;
  description: string;
  events: ScenarioEvent[];
  checklist: ChecklistItem[];
  timeLimit?: number;
}

// Hotspot structure
interface Hotspot {
  id: string;
  position: { left: string; top: string; width: string; height: string };
  popupImage?: string;
  label?: string;
  action?: string;
}

export default function ShipBridgeSimulator() {
  const [currentScene, setCurrentScene] = useState<Scene>('center');
  const [alarmActive, setAlarmActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [shipProgress, setShipProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const [activePopup, setActivePopup] = useState<string | null>(null);
  
  // Scenario system state
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [scenarioStartTime, setScenarioStartTime] = useState<number | null>(null);
  const [actionLog, setActionLog] = useState<ActionLog[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [scenarioComplete, setScenarioComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Visual effects state
  const [lightsLevel, setLightsLevel] = useState(1);
  const [visualEffects, setVisualEffects] = useState<string[]>([]);

  // VHF Chatter system
  const [vhfAudioElement, setVhfAudioElement] = useState<HTMLAudioElement | null>(null);
  const vhfTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [vhfChatterEnabled, setVhfChatterEnabled] = useState(true);
  const vhfPlayingRef = useRef<boolean>(false);

  // Lookout positioning state - matches scene positions
  const [lookoutPosition, setLookoutPosition] = useState<Scene>('center');
  const [showLookoutArrows, setShowLookoutArrows] = useState(false);
  const [lookoutTransitioning, setLookoutTransitioning] = useState(false);
  const [lookoutExitDirection, setLookoutExitDirection] = useState<'left' | 'right' | null>(null);

  // Memoized scenarios data
  const scenarios = useMemo<Scenario[]>(() => [
    {
      id: "man-overboard",
      name: "Man Overboard",
      description: "Crew member has fallen overboard. Execute immediate rescue procedures.",
      timeLimit: 300,
      events: [
        {
          id: "mob-alarm",
          type: "alarm",
          trigger: "immediate",
          data: { active: true }
        }
      ],
      checklist: [
        {
          id: "mob-1",
          action: "Sound alarm (General Alarm)",
          location: "center",
          buttonId: "silence-alarm-btn",
          order: 1,
          completed: false
        },
        {
          id: "mob-2",
          action: "Deploy life buoy from port side",
          location: "port",
          buttonId: "lifebuoy-port",
          order: 2,
          completed: false
        },
        {
          id: "mob-3",
          action: "Mark position on ECDIS",
          location: "center",
          buttonId: "ecdis",
          order: 3,
          completed: false
        },
        {
          id: "mob-4",
          action: "Hard turn to starboard (Williamson Turn)",
          location: "center",
          buttonId: "helm",
          order: 4,
          completed: false
        },
        {
          id: "mob-5",
          action: "Reduce engine speed",
          location: "center",
          buttonId: "engine-telegraph",
          order: 5,
          completed: false
        },
        {
          id: "mob-6",
          action: "Make VHF distress call",
          location: "center",
          buttonId: "vhf-radio",
          order: 6,
          completed: false
        },
        {
          id: "mob-7",
          action: "Post lookout on starboard wing",
          location: "starboard",
          buttonId: "starboard-lookout",
          order: 7,
          completed: false
        },
        {
          id: "mob-8",
          action: "Log incident in ship's log",
          location: "center",
          buttonId: "logbook",
          order: 8,
          completed: false
        }
      ]
    },
    {
      id: "blackout",
      name: "Total Blackout",
      description: "Complete power failure. Restore emergency systems and ensure vessel safety.",
      timeLimit: 600,
      events: [
        {
          id: "blackout-lights",
          type: "lighting",
          trigger: "immediate",
          data: { level: 0.1 }
        },
        {
          id: "blackout-alarm",
          type: "alarm",
          trigger: "delayed",
          delay: 2000,
          data: { active: true }
        },
        {
          id: "restore-emergency-lights",
          type: "lighting",
          trigger: "delayed",
          delay: 5000,
          data: { level: 0.3 }
        }
      ],
      checklist: [
        {
          id: "blackout-1",
          action: "Acknowledge blackout alarm",
          location: "center",
          buttonId: "silence-alarm-btn",
          order: 1,
          completed: false
        },
        {
          id: "blackout-2",
          action: "Check radar for traffic",
          location: "center",
          buttonId: "radar",
          order: 2,
          completed: false
        },
        {
          id: "blackout-3",
          action: "Switch to manual steering",
          location: "center",
          buttonId: "helm",
          order: 3,
          completed: false
        },
        {
          id: "blackout-4",
          action: "Verify position on ECDIS backup",
          location: "center",
          buttonId: "ecdis",
          order: 4,
          completed: false
        },
        {
          id: "blackout-5",
          action: "Post lookouts port and starboard",
          location: "port",
          buttonId: "port-lookout",
          order: 5,
          completed: false
        },
        {
          id: "blackout-6",
          action: "Verify starboard lookout posted",
          location: "starboard",
          buttonId: "starboard-lookout",
          order: 6,
          completed: false
        },
        {
          id: "blackout-7",
          action: "Make Pan-Pan call on VHF",
          location: "center",
          buttonId: "vhf-radio",
          order: 7,
          completed: false
        },
        {
          id: "blackout-8",
          action: "Log blackout in deck log",
          location: "center",
          buttonId: "logbook",
          order: 8,
          completed: false
        }
      ]
    },
    {
      id: "fire-alarm",
      name: "Fire in Engine Room",
      description: "Fire detected in engine room. Implement fire response procedures.",
      timeLimit: 420,
      events: [
        {
          id: "fire-alarm",
          type: "alarm",
          trigger: "immediate",
          data: { active: true }
        }
      ],
      checklist: [
        {
          id: "fire-1",
          action: "Sound general alarm",
          location: "center",
          buttonId: "silence-alarm-btn",
          order: 1,
          completed: false
        },
        {
          id: "fire-2",
          action: "Check ECDIS position",
          location: "center",
          buttonId: "ecdis",
          order: 2,
          completed: false
        },
        {
          id: "fire-3",
          action: "Stop engines",
          location: "center",
          buttonId: "engine-telegraph",
          order: 3,
          completed: false
        },
        {
          id: "fire-4",
          action: "Make Mayday call",
          location: "center",
          buttonId: "vhf-radio",
          order: 4,
          completed: false
        },
        {
          id: "fire-5",
          action: "Prepare to abandon ship - check port side",
          location: "port",
          buttonId: "port-lookout",
          order: 5,
          completed: false
        },
        {
          id: "fire-6",
          action: "Check starboard evacuation route",
          location: "starboard",
          buttonId: "starboard-lookout",
          order: 6,
          completed: false
        },
        {
          id: "fire-7",
          action: "Log emergency in deck log",
          location: "center",
          buttonId: "logbook",
          order: 7,
          completed: false
        }
      ]
    },
    {
      id: "collision-avoidance",
      name: "Collision Avoidance",
      description: "Vessel on collision course detected. Execute evasive maneuvers.",
      timeLimit: 180,
      events: [
        {
          id: "collision-alarm",
          type: "alarm",
          trigger: "delayed",
          delay: 3000,
          data: { active: true }
        }
      ],
      checklist: [
        {
          id: "collision-1",
          action: "Check radar for CPA/TCPA",
          location: "center",
          buttonId: "radar",
          order: 1,
          completed: false
        },
        {
          id: "collision-2",
          action: "Verify position on ECDIS",
          location: "center",
          buttonId: "ecdis",
          order: 2,
          completed: false
        },
        {
          id: "collision-3",
          action: "Execute starboard turn",
          location: "center",
          buttonId: "helm",
          order: 3,
          completed: false
        },
        {
          id: "collision-4",
          action: "Sound 5 short blasts",
          location: "center",
          buttonId: "silence-alarm-btn",
          order: 4,
          completed: false
        },
        {
          id: "collision-5",
          action: "Call other vessel on VHF Ch 16",
          location: "center",
          buttonId: "vhf-radio",
          order: 5,
          completed: false
        },
        {
          id: "collision-6",
          action: "Post lookout on starboard wing",
          location: "starboard",
          buttonId: "starboard-lookout",
          order: 6,
          completed: false
        },
        {
          id: "collision-7",
          action: "Log incident",
          location: "center",
          buttonId: "logbook",
          order: 7,
          completed: false
        }
      ]
    }
  ], []);
  
  // Initialize logbook with default entries
  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    {
      time: '1100',
      heading: '120 deg',
      speed: '15.6 kts',
      depth: '62.8m',
      visibility: 'Clear',
      event: 'Hourly Position 45° 34.8′ N 22° 03.6′ W'
    },
    {
      time: '1200',
      heading: '130 deg',
      speed: '15.0kts',
      depth: '100.1m',
      visibility: 'Clear',
      event: 'Noon Position 46° 12.4′ N 23° 01.2′ W Compass Error 3 E, Wind Force 5, Direction 235, Sea State 4, Swell 3, Visibility 12NM, Barometer 1001, Temp +19'
    },
    {
      time: '1207',
      heading: '131 deg',
      speed: '15.1kts',
      depth: '98.6m',
      visibility: 'Clear',
      event: 'Watch Handover Completed to Deck Cadet'
    }
  ]);

  const [shipInfo, setShipInfo] = useState(() => {
    const today = new Date();
    return {
      shipType: 'C.G.',
      hullNumber: '',
      date: today.getDate().toString().padStart(2, '0'),
      month: (today.getMonth() + 1).toString().padStart(2, '0'),
      year: today.getFullYear().toString()
    };
  });

  // Start a scenario
  const startScenario = useCallback((scenario: Scenario) => {
    setCurrentScenario(scenario);
    setScenarioStartTime(Date.now());
    setActionLog([]);
    setChecklist(scenario.checklist.map(item => ({ ...item, completed: false })));
    setScenarioComplete(false);
    setShowResults(false);
    
    // Trigger immediate events
    scenario.events.forEach(event => {
      if (event.trigger === 'immediate') {
        executeEvent(event);
      } else if (event.trigger === 'delayed' && event.delay) {
        setTimeout(() => executeEvent(event), event.delay);
      }
    });
  }, []);

  // Execute a scenario event
  const executeEvent = useCallback((event: ScenarioEvent) => {
    switch (event.type) {
      case 'alarm':
        setAlarmActive(event.data.active);
        break;
      case 'lighting':
        setLightsLevel(event.data.level);
        break;
      case 'ship_movement':
        // Could trigger ship movement animation
        break;
      case 'visual':
        setVisualEffects(prev => [...prev, event.data.effect]);
        break;
      case 'sound':
        // Play sound effect
        playSound(event.data.soundFile);
        break;
    }
  }, []);

  // Play sound effect
  const playSound = useCallback((soundFile: string) => {
    const audio = new Audio(soundFile);
    audio.play().catch(err => console.error('Sound play failed:', err));
  }, []);

  // VHF Chatter system - plays random radio chatter
  const playVHFChatter = useCallback(() => {
    if (!vhfChatterEnabled || vhfPlayingRef.current) return;

    // IMPORTANT: Move your vhfchatter folder to /public/vhfchatter/
    // Browser can only access files from the public folder
    // List the actual filenames of your MP3 files here
    const vhfFiles = [
      '/vhfchatter/chatter1.mp3',
      '/vhfchatter/chatter2.mp3',
      '/vhfchatter/chatter3.mp3',
      '/vhfchatter/chatter4.mp3',
      '/vhfchatter/chatter5.mp3',
      '/vhfchatter/chatter6.mp3',
      '/vhfchatter/chatter7.mp3',
      '/vhfchatter/chatter8.mp3',
      '/vhfchatter/chatter9.mp3',
      '/vhfchatter/chatter10.mp3'
    ];

    // Pick a random file
    const randomFile = vhfFiles[Math.floor(Math.random() * vhfFiles.length)];
    
    // Mark as playing
    vhfPlayingRef.current = true;
    
    // Create and play audio
    const audio = new Audio(randomFile);
    audio.volume = 0.3; // Set volume to 30% so it's background noise
    
    audio.play().catch(err => {
      console.log('VHF chatter play failed:', randomFile, err);
      vhfPlayingRef.current = false;
      // Schedule next on error
      if (vhfTimeoutRef.current) {
        clearTimeout(vhfTimeoutRef.current);
      }
      vhfTimeoutRef.current = setTimeout(() => {
        playVHFChatter();
      }, 30000);
    });

    // When audio ends, wait 30s then schedule next
    audio.onended = () => {
      vhfPlayingRef.current = false;
      // Wait 30 seconds before playing next
      if (vhfTimeoutRef.current) {
        clearTimeout(vhfTimeoutRef.current);
      }
      vhfTimeoutRef.current = setTimeout(() => {
        playVHFChatter();
      }, 30000); // 30 seconds
    };

    // If audio fails to load, also schedule next
    audio.onerror = () => {
      console.log('VHF audio error for:', randomFile);
      vhfPlayingRef.current = false;
      // Schedule next on error
      if (vhfTimeoutRef.current) {
        clearTimeout(vhfTimeoutRef.current);
      }
      vhfTimeoutRef.current = setTimeout(() => {
        playVHFChatter();
      }, 30000);
    };

    setVhfAudioElement(audio);
  }, [vhfChatterEnabled]);

  // Log an action
  const logAction = useCallback((action: string, buttonId: string) => {
    if (!currentScenario) return;

    const timestamp = Date.now();
    
    setActionLog(prev => {
      const checklistItem = checklist.find(item => item.buttonId === buttonId);
      
      const newLog: ActionLog = {
        timestamp,
        action,
        location: currentScene,
        correct: checklistItem ? !checklistItem.completed : false,
        expectedOrder: checklistItem?.order,
        actualOrder: prev.length + 1
      };

      return [...prev, newLog];
    });

    // Update checklist if this was a checklist action
    setChecklist(prev => {
      const checklistItem = prev.find(item => item.buttonId === buttonId);
      
      if (checklistItem && !checklistItem.completed) {
        const updatedChecklist = prev.map(item => 
          item.id === checklistItem.id 
            ? { ...item, completed: true, timeCompleted: timestamp }
            : item
        );

        // Check if scenario is complete
        if (updatedChecklist.every(item => item.completed)) {
          setTimeout(completeScenario, 100);
        }

        return updatedChecklist;
      }
      return prev;
    });
  }, [currentScenario, currentScene, checklist]);

  // Complete the scenario
  const completeScenario = useCallback(() => {
    setScenarioComplete(true);
    setAlarmActive(false);
    
    // Add completion to logbook
    setLogEntries(prev => {
      const newEntry: LogEntry = {
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        heading: '',
        speed: '',
        depth: '',
        visibility: '',
        event: `Scenario "${currentScenario?.name}" completed`
      };
      return [...prev, newEntry];
    });
  }, [currentScenario]);

  // Calculate scenario performance
  const calculatePerformance = useCallback(() => {
    if (!currentScenario || !scenarioStartTime) return null;

    const totalTime = actionLog.length > 0 
      ? (actionLog[actionLog.length - 1].timestamp - scenarioStartTime) / 1000
      : 0;

    const correctOrder = actionLog.every((log, idx) => {
      if (log.expectedOrder === undefined) return true;
      return log.expectedOrder === log.actualOrder;
    });

    const completedActions = checklist.filter(item => item.completed).length;
    const totalActions = checklist.length;

    return {
      totalTime,
      correctOrder,
      completedActions,
      totalActions,
      score: (completedActions / totalActions) * 100
    };
  }, [currentScenario, scenarioStartTime, actionLog, checklist]);

  // Add new log entry
  const addLogEntry = useCallback(() => {
    const newEntry: LogEntry = {
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      heading: '',
      speed: '',
      depth: '',
      visibility: '',
      event: ''
    };
    setLogEntries(prev => [...prev, newEntry]);
  }, []);

  const updateLogEntry = useCallback((index: number, field: keyof LogEntry, value: string) => {
    setLogEntries(prev => {
      const newEntries = [...prev];
      newEntries[index][field] = value;
      return newEntries;
    });
  }, []);

  const deleteLogEntry = useCallback((index: number) => {
    setLogEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Ship animation effect
  useEffect(() => {
    const animationInterval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const progress = elapsed * 2;
      setShipProgress(progress);
    }, 50);

    return () => clearInterval(animationInterval);
  }, []);

  // Alarm sound effect
  useEffect(() => {
    if (alarmActive) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const ALARM_VOLUME = 0.05;

      const shipAlarm = () => {
        const now = audioContext.currentTime;

        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();

        osc1.type = 'square';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(700, now);
        osc2.frequency.setValueAtTime(800, now);

        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(ALARM_VOLUME, now + 0.04);
        gain.gain.linearRampToValueAtTime(0, now + 0.45);

        const tremolo = audioContext.createOscillator();
        const tremoloGain = audioContext.createGain();

        tremolo.frequency.value = 5;
        tremoloGain.gain.value = ALARM_VOLUME * 0.25;

        tremolo.connect(tremoloGain);
        tremoloGain.connect(gain.gain);

        osc1.frequency.linearRampToValueAtTime(840, now + 0.25);
        osc2.frequency.linearRampToValueAtTime(820, now + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);

        osc1.start(now);
        osc2.start(now);
        tremolo.start(now);

        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
        tremolo.stop(now + 0.5);
      };

      alarmIntervalRef.current = setInterval(shipAlarm, 700);
      shipAlarm();

      return () => {
        if (alarmIntervalRef.current) {
          clearInterval(alarmIntervalRef.current);
        }
      };
    }
  }, [alarmActive]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // VHF Chatter system - start when component mounts
  useEffect(() => {
    if (vhfChatterEnabled && !vhfPlayingRef.current && !vhfTimeoutRef.current) {
      // Start first chatter after 5 seconds (only if not already scheduled)
      vhfTimeoutRef.current = setTimeout(() => {
        playVHFChatter();
      }, 5000);
    }

    // Cleanup on unmount only
    return () => {
      if (vhfTimeoutRef.current) {
        clearTimeout(vhfTimeoutRef.current);
        vhfTimeoutRef.current = null;
      }
      if (vhfAudioElement) {
        vhfAudioElement.pause();
        vhfAudioElement.currentTime = 0;
      }
      vhfPlayingRef.current = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate effect to handle enable/disable toggle
  useEffect(() => {
    if (!vhfChatterEnabled) {
      // Stop current audio and clear timeout when disabled
      if (vhfTimeoutRef.current) {
        clearTimeout(vhfTimeoutRef.current);
        vhfTimeoutRef.current = null;
      }
      if (vhfAudioElement) {
        vhfAudioElement.pause();
        vhfAudioElement.currentTime = 0;
      }
      vhfPlayingRef.current = false;
    }
  }, [vhfChatterEnabled, vhfAudioElement]);

  const getShipPosition = useCallback(() => {
    const perspectiveOffsets: Record<Scene, number> = {
      port: 27,
      center: 0,
      starboard: -27
    };
    
    const basePosition = 50 + (shipProgress * 0.5);
    const finalPosition = basePosition + perspectiveOffsets[currentScene];
    
    return `${finalPosition}%`;
  }, [shipProgress, currentScene]);

  const getShipSize = useCallback(() => {
    const baseSize = 50;
    const baseProgress = Math.min(shipProgress, 100) / 100;
    const growthFactor = 1 + (1 - Math.cos(baseProgress * Math.PI / 2)) * 0.8;
    return baseSize * growthFactor;
  }, [shipProgress]);

  const sceneLabels: Record<Scene, string> = useMemo(() => ({
    port: 'Port Wing',
    center: 'Center Bridge',
    starboard: 'Starboard Wing'
  }), []);

  const bridgeMedia: Record<Scene, { type: 'video' | 'image'; src: string }> = useMemo(() => ({
    port: { type: 'image', src: '/shipimages/PS-Wing.png' },
    center: { type: 'video', src: '/shipimages/bridge_anim.webm' },
    starboard: { type: 'image', src: '/shipimages/SBWind.png' }
  }), []);

  const changeScene = useCallback((scene: Scene) => {
    setIsFading(true);
    
    setTimeout(() => {
      setCurrentScene(scene);
    }, 150);
    
    setTimeout(() => {
      setIsFading(false);
    }, 300);
  }, []);

  const silenceAlarm = useCallback(() => {
    setAlarmActive(false);
    logAction('Silence alarm', 'silence-alarm-btn');
  }, [logAction]);

  // Interactive hotspots with actions - memoized
  const hotspots: Record<Scene, Hotspot[]> = useMemo(() => ({
    center: [
      {
        id: 'radar',
        position: { left: '62%', top: '55%', width: '15%', height: '20%' },
        popupImage: '/shipimages/celest.jpeg',
        label: 'Radar Console',
        action: 'check-radar'
      },
      {
        id: 'logbook',
        position: { left: '65%', top: '72%', width: '15%', height: '15%' },
        popupImage: '/shipimages/celest.jpeg',
        label: 'Logbook',
        action: 'open-logbook'
      },
      {
        id: 'helm',
        position: { left: '40%', top: '60%', width: '10%', height: '15%' },
        popupImage: '/shipimages/helm-closeup.png',
        label: 'Helm Controls',
        action: 'check-helm'
      },
      {
        id: 'ecdis',
        position: { left: '24%', top: '55%', width: '15%', height: '20%' },
        popupImage: '/shipimages/ecdis.png',
        label: 'ECDIS',
        action: 'check-ecdis'
      },
      {
        id: 'vhf-radio',
        position: { left: '78%', top: '48%', width: '8%', height: '12%' },
        label: 'VHF Radio',
        action: 'use-vhf'
      },
      {
        id: 'engine-telegraph',
        position: { left: '48%', top: '65%', width: '6%', height: '10%' },
        label: 'Engine Telegraph',
        action: 'adjust-engine'
      }
    ],
    port: [
      {
        id: 'port-lookout',
        position: { left: '20%', top: '40%', width: '30%', height: '25%' },
        popupImage: '/shipimages/port-view-closeup.png',
        label: 'Port Lookout',
        action: 'port-lookout'
      },
      {
        id: 'lifebuoy-port',
        position: { left: '15%', top: '70%', width: '10%', height: '15%' },
        label: 'Life Buoy',
        action: 'deploy-lifebuoy-port'
      }
    ],
    starboard: [
      {
        id: 'starboard-lookout',
        position: { left: '50%', top: '40%', width: '30%', height: '25%' },
        popupImage: '/shipimages/starboard-view-closeup.png',
        label: 'Starboard Lookout',
        action: 'starboard-lookout'
      },
      {
        id: 'lifebuoy-starboard',
        position: { left: '75%', top: '70%', width: '10%', height: '15%' },
        label: 'Life Buoy',
        action: 'deploy-lifebuoy-starboard'
      }
    ]
  }), []);

  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    // Log action only if it's a checklist item (not logbook opening)
    if (hotspot.action && hotspot.id !== 'logbook') {
      logAction(hotspot.label || hotspot.action, hotspot.id);
    }
    // Open popup for items with images or logbook
    if (hotspot.popupImage || hotspot.id === 'logbook') {
      setActivePopup(hotspot.id);
    }
  }, [logAction]);

  const moveLookout = useCallback((direction: Scene) => {
    if (lookoutPosition === direction) return;
    
    setShowLookoutArrows(false);
    
    // Determine exit direction based on current and target position
    const sceneOrder: Scene[] = ['port', 'center', 'starboard'];
    const currentIndex = sceneOrder.indexOf(lookoutPosition);
    const targetIndex = sceneOrder.indexOf(direction);
    const exitDir = targetIndex > currentIndex ? 'right' : 'left';
    
    // Start exit animation
    setLookoutExitDirection(exitDir);
    setLookoutTransitioning(true);
    
    // After exit animation, change position and enter from opposite side
    setTimeout(() => {
      setLookoutPosition(direction);
      setLookoutExitDirection(null);
      
      // End transition after enter animation
      setTimeout(() => {
        setLookoutTransitioning(false);
      }, 600);
    }, 600);
    
    // Log action and trigger lookout event if in scenario
    if (currentScenario) {
      logAction(`Move lookout to ${direction} wing`, `lookout-move-${direction}`);
      
      // Trigger the appropriate lookout checklist item
      if (direction === 'port') {
        logAction('Post lookout on port wing', 'port-lookout');
      } else if (direction === 'starboard') {
        logAction('Post lookout on starboard wing', 'starboard-lookout');
      }
    }
  }, [currentScenario, logAction, lookoutPosition]);

  const getLookoutStyle = useCallback((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: '0%',
      height: '100%',
      zIndex: 11,
      pointerEvents: lookoutTransitioning ? 'none' : 'auto',
      cursor: 'pointer'
    };

    // Determine base position for each scene
    let baseLeft = '5%';
    
    switch (lookoutPosition) {
      case 'port':
        baseLeft = '10%';
        break;
      case 'center':
        baseLeft = '5%';
        break;
      case 'starboard':
        baseLeft = '70%';
        break;
    }

    // Apply transition animation
    if (lookoutTransitioning) {
      if (lookoutExitDirection === 'left') {
        // Exiting to the left
        return {
          ...baseStyle,
          left: '-20%',
          transition: 'left 0.6s ease-in-out',
        };
      } else if (lookoutExitDirection === 'right') {
        // Exiting to the right
        return {
          ...baseStyle,
          left: '120%',
          transition: 'left 0.6s ease-in-out',
        };
      } else {
        // Entering - determine entry direction based on previous exit
        const isEnteringFromLeft = lookoutExitDirection === null;
        return {
          ...baseStyle,
          left: baseLeft,
          transition: 'left 0.6s ease-in-out',
        };
      }
    }

    // Normal positioning (no transition)
    return {
      ...baseStyle,
      left: baseLeft,
      transition: 'all 0.3s ease',
    };
  }, [lookoutPosition, lookoutTransitioning, lookoutExitDirection]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      {/* Lighting overlay for blackout effects */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-black z-[5] pointer-events-none transition-opacity duration-1000"
        style={{ opacity: 1 - lightsLevel }}
      />

      <div 
        className={`absolute top-0 left-0 w-full h-full bg-black z-50 pointer-events-none transition-opacity duration-150 ${
          isFading ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Ocean background */}
      <div className="absolute top-0 left-0 w-full h-full animate-ocean-motion">
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-[1]"
          style={{ backgroundImage: "url('/shipimages/Ocean3.png')" }}
        />
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-[2] animate-wave"
          style={{ backgroundImage: "url('/shipimages/ocean4.png')" }}
        />
      </div>

      {/* Ship on horizon */}
      <div className="absolute top-[33%] left-0 w-full h-[20%] z-[3] pointer-events-none animate-ocean-motion">
        <img
          src="/shipimages/pdv_stbd_over50m_underway_day.png"
          alt="Ship on horizon"
          className="absolute top-1/2 -translate-y-1/2"
          style={{ 
            left: getShipPosition(),
            height: `${getShipSize()}px`,
            transform: `translateY(-50%)`,
            opacity: shipProgress > 100 ? 0 : 1,
            display: shipProgress > 120 ? 'none' : 'block'
          }}
        />
      </div>

      {/* Bridge scene */}
      {bridgeMedia[currentScene].type === 'video' ? (
        <video
          key={currentScene}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full max-w-screen max-h-screen z-10 pointer-events-none object-contain object-bottom"
          src={bridgeMedia[currentScene].src}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <div
          key={currentScene}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full max-w-screen max-h-screen z-10 pointer-events-none bg-contain bg-center-bottom bg-no-repeat"
          style={{ backgroundImage: `url('${bridgeMedia[currentScene].src}')` }}
        />
      )}

      {/* Lookout character - show on their assigned scene or during transitions */}
      {(lookoutPosition === currentScene || (lookoutTransitioning && lookoutPosition === currentScene)) && (
        <div
          style={getLookoutStyle()}
          onMouseEnter={() => !lookoutTransitioning && setShowLookoutArrows(true)}
          onMouseLeave={() => setShowLookoutArrows(false)}
        >
          <img
            src="/shipimages/lookout.png"
            alt="Lookout"
            className={lookoutTransitioning ? 'animate-walk' : 'animate-idle-sway'}
            style={{
              height: '100%',
              width: 'auto',
              objectFit: 'contain',
              imageRendering: 'crisp-edges',
              transform: currentScene === 'starboard' ? 'scaleX(-1)' : 'scaleX(1)',
              transformOrigin: 'center center',
              flexShrink: 0,
              minHeight: '100%'
            }}
          />
          
          {showLookoutArrows && !lookoutTransitioning && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 bg-[rgba(0,40,60,0.95)] border-2 border-[#00d9ff] rounded-lg p-3 shadow-[0_0_30px_rgba(0,217,255,0.8)]">
              <div className="text-[#00d9ff] text-sm font-bold text-center mb-1 whitespace-nowrap">
                Move Lookout To:
              </div>
              <button
                onClick={() => moveLookout('port')}
                className="px-4 py-2 bg-[rgba(0,100,150,0.8)] border border-[#00d9ff] text-white rounded hover:bg-[rgba(0,150,200,0.9)] transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={lookoutPosition === 'port'}
              >
                ← Port Wing
              </button>
              <button
                onClick={() => moveLookout('center')}
                className="px-4 py-2 bg-[rgba(0,100,150,0.8)] border border-[#00d9ff] text-white rounded hover:bg-[rgba(0,150,200,0.9)] transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={lookoutPosition === 'center'}
              >
                Center Bridge
              </button>
              <button
                onClick={() => moveLookout('starboard')}
                className="px-4 py-2 bg-[rgba(0,100,150,0.8)] border border-[#00d9ff] text-white rounded hover:bg-[rgba(0,150,200,0.9)] transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={lookoutPosition === 'starboard'}
              >
                Starboard Wing →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Alarm visual effect */}
      {alarmActive && currentScene === 'center' && (
        <div 
          className="absolute top-0 left-0 w-full h-full z-[15] pointer-events-none animate-flash"
          style={{ 
            backgroundImage: "url('/shipimages/alarm.png')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        />
      )}

      {/* Scene label */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-[#00d9ff] text-2xl font-bold pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.8)]">
        {sceneLabels[currentScene]}
      </div>

      {/* VHF Chatter Toggle */}
      <div className="absolute top-5 left-5 z-20 flex gap-2">
        <button
          onClick={() => setVhfChatterEnabled(!vhfChatterEnabled)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all pointer-events-auto ${
            vhfChatterEnabled
              ? 'bg-green-700 border-2 border-green-500 text-white hover:bg-green-600'
              : 'bg-gray-700 border-2 border-gray-500 text-gray-300 hover:bg-gray-600'
          }`}
          title={vhfChatterEnabled ? 'VHF Chatter: ON' : 'VHF Chatter: OFF'}
        >
          📻 VHF {vhfChatterEnabled ? 'ON' : 'OFF'}
        </button>
        
        {/* Test button to play chatter immediately */}
        <button
          onClick={() => {
            console.log('Manual VHF test triggered');
            playVHFChatter();
          }}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all pointer-events-auto bg-blue-700 border-2 border-blue-500 text-white hover:bg-blue-600"
          title="Test VHF Chatter Now"
        >
          🔊 Test VHF
        </button>
      </div>

      {/* Scenario selector (when no scenario active) */}
      {!currentScenario && (
        <div className="absolute top-20 right-5 z-20 bg-[rgba(0,40,60,0.95)] border-2 border-[#00d9ff] rounded-lg p-4 max-w-xs">
          <h3 className="text-[#00d9ff] text-lg font-bold mb-3">Emergency Scenarios</h3>
          <div className="space-y-2">
            {scenarios.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => startScenario(scenario)}
                className="w-full px-4 py-2 bg-[rgba(0,100,150,0.8)] border border-[#00d9ff] text-white rounded hover:bg-[rgba(0,150,200,0.9)] transition-all"
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active scenario checklist */}
      {currentScenario && !showResults && (
        <div className="absolute top-20 right-5 z-20 bg-[rgba(0,40,60,0.95)] border-2 border-[#00d9ff] rounded-lg p-4 max-w-md">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-[#00d9ff] text-lg font-bold">{currentScenario.name}</h3>
            <button
              onClick={() => setShowResults(true)}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              View Results
            </button>
          </div>
          <p className="text-gray-300 text-sm mb-4">{currentScenario.description}</p>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {checklist.map((item, idx) => (
              <div
                key={item.id}
                className={`p-2 rounded border ${
                  item.completed 
                    ? 'bg-green-900/30 border-green-500' 
                    : 'bg-red-900/30 border-red-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.completed ? '✓' : '○'}</span>
                  <span className="text-white text-sm flex-1">
                    {idx + 1}. {item.action}
                  </span>
                  {item.completed && item.timeCompleted && scenarioStartTime && (
                    <span className="text-xs text-green-400">
                      {((item.timeCompleted - scenarioStartTime) / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {scenarioComplete && (
            <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded">
              <p className="text-green-400 font-bold text-center">✓ Scenario Complete!</p>
            </div>
          )}
        </div>
      )}

      {/* Results view */}
      {showResults && currentScenario && (() => {
        const performance = calculatePerformance();
        return performance && (
          <div className="absolute top-20 right-5 z-20 bg-[rgba(0,40,60,0.98)] border-2 border-[#00d9ff] rounded-lg p-4 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-[#00d9ff] text-xl font-bold">Scenario Results</h3>
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentScenario(null);
                  setActionLog([]);
                  setChecklist([]);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[rgba(0,100,150,0.3)] p-3 rounded border border-[#00d9ff]">
                  <div className="text-gray-400 text-sm">Total Time</div>
                  <div className="text-white text-2xl font-bold">{performance.totalTime.toFixed(1)}s</div>
                </div>
                <div className="bg-[rgba(0,100,150,0.3)] p-3 rounded border border-[#00d9ff]">
                  <div className="text-gray-400 text-sm">Score</div>
                  <div className="text-white text-2xl font-bold">{performance.score.toFixed(0)}%</div>
                </div>
              </div>

              <div className="bg-[rgba(0,100,150,0.3)] p-3 rounded border border-[#00d9ff]">
                <div className="text-gray-400 text-sm mb-2">Actions Completed</div>
                <div className="text-white text-lg">
                  {performance.completedActions} / {performance.totalActions}
                </div>
              </div>

              <div className="bg-[rgba(0,100,150,0.3)] p-3 rounded border border-[#00d9ff]">
                <div className="text-gray-400 text-sm mb-2">Correct Order</div>
                <div className={`text-lg font-bold ${performance.correctOrder ? 'text-green-400' : 'text-red-400'}`}>
                  {performance.correctOrder ? '✓ Yes' : '✗ No'}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-[#00d9ff] font-bold mb-3">Action Log</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {actionLog.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-sm ${
                        log.correct 
                          ? 'bg-green-900/30 border-l-4 border-green-500' 
                          : 'bg-gray-800/50 border-l-4 border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-medium">{log.action}</div>
                          <div className="text-gray-400 text-xs">
                            {log.location} • Order: #{log.actualOrder}
                            {log.expectedOrder && ` (Expected: #${log.expectedOrder})`}
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {scenarioStartTime 
                            ? `+${((log.timestamp - scenarioStartTime) / 1000).toFixed(1)}s`
                            : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Silence alarm button */}
      {alarmActive && currentScene === 'center' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={silenceAlarm}
            className="px-8 py-4 rounded-[5px] text-xl font-bold transition-all duration-300 pointer-events-auto bg-red-700 border-2 border-red-500 text-white hover:bg-red-600 hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] animate-pulse"
          >
            🔔 SILENCE ALARM
          </button>
        </div>
      )}

      {/* Scene navigation buttons */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-[15px]">
        <button
          onClick={() => changeScene('port')}
          className={`px-6 py-3 rounded-[5px] text-base font-bold transition-all duration-300 pointer-events-auto
            ${currentScene === 'port' 
              ? 'bg-[rgba(0,217,255,0.3)] border-2 border-white text-white' 
              : 'bg-[rgba(0,40,60,0.8)] border-2 border-[#00d9ff] text-[#00d9ff] hover:bg-[rgba(0,100,150,0.9)] hover:shadow-[0_0_15px_rgba(0,217,255,0.5)]'
            }`}
        >
          ← Port Wing
        </button>
        <button
          onClick={() => changeScene('center')}
          className={`px-6 py-3 rounded-[5px] text-base font-bold transition-all duration-300 pointer-events-auto
            ${currentScene === 'center' 
              ? 'bg-[rgba(0,217,255,0.3)] border-2 border-white text-white' 
              : 'bg-[rgba(0,40,60,0.8)] border-2 border-[#00d9ff] text-[#00d9ff] hover:bg-[rgba(0,100,150,0.9)] hover:shadow-[0_0_15px_rgba(0,217,255,0.5)]'
            }`}
        >
          Center
        </button>
        <button
          onClick={() => changeScene('starboard')}
          className={`px-6 py-3 rounded-[5px] text-base font-bold transition-all duration-300 pointer-events-auto
            ${currentScene === 'starboard' 
              ? 'bg-[rgba(0,217,255,0.3)] border-2 border-white text-white' 
              : 'bg-[rgba(0,40,60,0.8)] border-2 border-[#00d9ff] text-[#00d9ff] hover:bg-[rgba(0,100,150,0.9)] hover:shadow-[0_0_15px_rgba(0,217,255,0.5)]'
            }`}
        >
          Starboard Wing →
        </button>
      </div>

      {/* Hotspots */}
      {hotspots[currentScene].map((hotspot) => (
        <div
          key={hotspot.id}
          className="absolute z-[12] cursor-pointer pointer-events-auto transition-all duration-200 hover:bg-[rgba(0,217,255,0.2)] border-2 border-transparent hover:border-[#00d9ff]"
          style={hotspot.position}
          onClick={() => handleHotspotClick(hotspot)}
          title={hotspot.label}
        />
      ))}

      {/* Popup overlay */}
      {activePopup && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center pointer-events-auto p-4"
          onClick={() => setActivePopup(null)}
        >
          {activePopup === 'logbook' ? (
            <div 
              className="relative w-full max-w-[1400px] h-[90vh] bg-white border-4 border-black shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white border-b-4 border-black p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-center mb-2">SHIP'S DECK LOG SHEET</h1>
                    <div className="text-xs text-right">Vessel Name: MV Warsash<br/>IMO: 16348275<br/>Callsign: D1WX7</div>
                  </div>
                  <button
                    onClick={() => setActivePopup(null)}
                    className="ml-4 w-8 h-8 bg-red-700 border-2 border-red-500 text-white rounded-full hover:bg-red-600 font-bold text-xl"
                  >
                    ×
                  </button>
                </div>

                <div className="border-2 border-black p-2 text-xs font-bold mb-2">
                  <div className="text-center mb-1">USE BLACK INK TO FILL IN THIS LOG</div>
                  <div className="flex gap-4 items-center justify-center">
                    <div className="flex gap-1 items-center">
                      <span>SHIP TYPE:</span>
                      <input
                        type="text"
                        value={shipInfo.shipType}
                        onChange={(e) => setShipInfo({...shipInfo, shipType: e.target.value})}
                        className="border border-black px-1 w-24"
                      />
                    </div>
                    <div className="flex gap-1 items-center">
                      <span>HULL NUMBER:</span>
                      <input
                        type="text"
                        value={shipInfo.hullNumber}
                        onChange={(e) => setShipInfo({...shipInfo, hullNumber: e.target.value})}
                        className="border border-black px-1 w-32"
                      />
                    </div>
                    <div className="flex gap-1 items-center">
                      <span>DATE:</span>
                      <input
                        type="text"
                        value={shipInfo.date}
                        onChange={(e) => setShipInfo({...shipInfo, date: e.target.value})}
                        className="border border-black px-1 w-12 text-center"
                        placeholder="DD"
                      />
                      <input
                        type="text"
                        value={shipInfo.month}
                        onChange={(e) => setShipInfo({...shipInfo, month: e.target.value})}
                        className="border border-black px-1 w-12 text-center"
                        placeholder="MM"
                      />
                      <input
                        type="text"
                        value={shipInfo.year}
                        onChange={(e) => setShipInfo({...shipInfo, year: e.target.value})}
                        className="border border-black px-1 w-16 text-center"
                        placeholder="YYYY"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[80px_80px_80px_80px_80px_1fr] border-2 border-black text-xs font-bold bg-gray-100">
                  <div className="border-r border-black p-1 text-center">TIME</div>
                  <div className="border-r border-black p-1 text-center">HEADING</div>
                  <div className="border-r border-black p-1 text-center">SPEED</div>
                  <div className="border-r border-black p-1 text-center">DEPTH</div>
                  <div className="border-r border-black p-1 text-center">VISIBILITY</div>
                  <div className="p-1 text-center">RECORD OF ALL EVENTS OF THE DAY</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-white">
                {logEntries.map((entry, index) => (
                  <div 
                    key={index}
                    className="grid grid-cols-[80px_80px_80px_80px_80px_1fr] border-b border-black text-xs hover:bg-gray-50 group"
                  >
                    <input
                      type="text"
                      value={entry.time}
                      onChange={(e) => updateLogEntry(index, 'time', e.target.value)}
                      className="border-r border-black p-1 text-center focus:bg-yellow-50 focus:outline-none"
                      placeholder="0000"
                    />
                    <input
                      type="text"
                      value={entry.heading}
                      onChange={(e) => updateLogEntry(index, 'heading', e.target.value)}
                      className="border-r border-black p-1 text-center focus:bg-yellow-50 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={entry.speed}
                      onChange={(e) => updateLogEntry(index, 'speed', e.target.value)}
                      className="border-r border-black p-1 text-center focus:bg-yellow-50 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={entry.depth}
                      onChange={(e) => updateLogEntry(index, 'depth', e.target.value)}
                      className="border-r border-black p-1 text-center focus:bg-yellow-50 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={entry.visibility}
                      onChange={(e) => updateLogEntry(index, 'visibility', e.target.value)}
                      className="border-r border-black p-1 text-center focus:bg-yellow-50 focus:outline-none"
                    />
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={entry.event}
                        onChange={(e) => updateLogEntry(index, 'event', e.target.value)}
                        className="w-full p-1 pr-8 focus:bg-yellow-50 focus:outline-none"
                        placeholder="Enter event description..."
                      />
                      <button
                        onClick={() => deleteLogEntry(index)}
                        className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded px-2 py-0.5 text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border-t-4 border-black p-3">
                <div className="flex justify-between items-center">
                  <button
                    onClick={addLogEntry}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition-colors"
                  >
                    + ADD NEW ENTRY
                  </button>
                  <div className="text-xs text-gray-600">
                    {logEntries.length} entries • Clears on refresh
                  </div>
                  <div className="text-xs">
                    OPNAV 3109/09 (Rev. 7-64)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="relative max-w-[90vw] max-h-[90vh] bg-[rgba(0,40,60,0.95)] border-4 border-[#00d9ff] rounded-lg p-4 shadow-[0_0_30px_rgba(0,217,255,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActivePopup(null)}
                className="absolute top-2 right-2 w-10 h-10 bg-red-700 border-2 border-red-500 text-white rounded-full hover:bg-red-600 font-bold text-xl z-[101]"
              >
                ×
              </button>
              
              <img
                src={hotspots[currentScene].find(h => h.id === activePopup)?.popupImage}
                alt="Control closeup"
                className="max-w-full max-h-[80vh] object-contain rounded"
              />
              
              {hotspots[currentScene].find(h => h.id === activePopup)?.label && (
                <div className="mt-4 text-center text-[#00d9ff] text-xl font-bold">
                  {hotspots[currentScene].find(h => h.id === activePopup)?.label}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes wave {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 0.7; }
          100% { opacity: 0; }
        }

        @keyframes oceanMotion {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          12.5% { transform: translate(1px, -2px) rotate(0.1deg); }
          25% { transform: translate(2.5px, -5px) rotate(0.25deg); }
          37.5% { transform: translate(3.5px, -7px) rotate(0.35deg); }
          50% { transform: translate(3px, -6px) rotate(0.3deg); }
          62.5% { transform: translate(2px, -4px) rotate(0.2deg); }
          75% { transform: translate(1px, -2px) rotate(0.1deg); }
          87.5% { transform: translate(-0.5px, 1px) rotate(-0.05deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }

        @keyframes idleSway {
          0% { 
            translate: 0px 0px;
            rotate: 0deg;
          }
          25% { 
            translate: 0px -2px;
            rotate: 0.3deg;
          }
          50% { 
            translate: 0px 0px;
            rotate: 0deg;
          }
          75% { 
            translate: 0px -1px;
            rotate: -0.3deg;
          }
          100% { 
            translate: 0px 0px;
            rotate: 0deg;
          }
        }

        @keyframes walk {
          0% { translate: 0px 0px; }
          25% { translate: 0px -4px; }
          50% { translate: 0px 0px; }
          75% { translate: 0px -4px; }
          100% { translate: 0px 0px; }
        }

        .animate-wave {
          animation: wave 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }

        .animate-flash {
          animation: flash 1s ease-in-out infinite;
        }

        .animate-ocean-motion {
          animation: oceanMotion 6s linear infinite;
          will-change: transform;
        }

        .animate-idle-sway {
          animation: idleSway 3s ease-in-out infinite;
        }

        .animate-walk {
          animation: walk 0.4s ease-in-out infinite;
        }

        .bg-center-bottom {
          background-position: center bottom;
        }
      `}</style>
    </div>
  );
}