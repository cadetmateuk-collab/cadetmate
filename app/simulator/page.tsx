'use client';

import { useState, useEffect, useRef } from 'react';

type Scene = 'port' | 'center' | 'starboard';

export default function ShipBridgeSimulator() {
  const [currentScene, setCurrentScene] = useState<Scene>('center');
  const [alarmActive, setAlarmActive] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (alarmActive) {
      // Create audio context for beeping sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const ALARM_VOLUME = 0.05; // 🔊 adjust this (0.05 – 0.5)

const shipAlarm = () => {
  const now = audioContext.currentTime;

  // Oscillators
  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();

  osc1.type = 'square';
  osc2.type = 'sine'; // softens the tone

  osc1.frequency.setValueAtTime(700, now);
  osc2.frequency.setValueAtTime(800, now); // subtle electrical beating

  // Main gain
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(ALARM_VOLUME, now + 0.04);
  gain.gain.linearRampToValueAtTime(0, now + 0.45);

  // Tremolo (alarm pulse)
  const tremolo = audioContext.createOscillator();
  const tremoloGain = audioContext.createGain();

  tremolo.frequency.value = 5; // pulse speed
  tremoloGain.gain.value = ALARM_VOLUME * 0.25;

  tremolo.connect(tremoloGain);
  tremoloGain.connect(gain.gain);

  // Gentle pitch sweep (not sandy)
  osc1.frequency.linearRampToValueAtTime(840, now + 0.25);
  osc2.frequency.linearRampToValueAtTime(820, now + 0.25);

  // Wiring
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioContext.destination);

  // Start / stop
  osc1.start(now);
  osc2.start(now);
  tremolo.start(now);

  osc1.stop(now + 0.5);
  osc2.stop(now + 0.5);
  tremolo.stop(now + 0.5);
};

// Loop
const intervalId = setInterval(shipAlarm, 700);
shipAlarm();



      return () => {
        clearInterval(intervalId);
        audioContext.close();
      };
    }
  }, [alarmActive]);

  const shipPositions: Record<Scene, string> = {
    port: '60%',
    center: '50%',
    starboard: '40%'
  };

  const sceneLabels: Record<Scene, string> = {
    port: 'Port Wing',
    center: 'Center Bridge',
    starboard: 'Starboard Wing'
  };

  const bridgeImages: Record<Scene, string> = {
    port: '/shipimages/PS-Wing.png',
    center: '/shipimages/CadetMateBridge.png',
    starboard: '/shipimages/SBWind.png'
  };

  const changeScene = (scene: Scene) => {
    setCurrentScene(scene);
  };

  const silenceAlarm = () => {
    setAlarmActive(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      {/* Ocean Background with Combined Motion - Both layers move together */}
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

      {/* Horizon Objects (Ships) with Same Motion as Ocean */}
      <div className="absolute top-[30%] left-0 w-full h-[20%] z-[3] pointer-events-none animate-ocean-motion">
        <img
          src="/shipimages/pdv_stbd_over50m_underway_day.png"
          alt="Ship on horizon"
          className="absolute top-1/2 -translate-y-1/2 h-[50px] transition-[left] duration-500 ease-out"
          style={{ left: shipPositions[currentScene] }}
        />
      </div>

      {/* Bridge Overlay (NO ROCKING) */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full max-w-screen max-h-screen z-10 pointer-events-none bg-contain bg-center-bottom bg-no-repeat"
        style={{ backgroundImage: `url('${bridgeImages[currentScene]}')` }}
      />

      {/* Flashing Alarm Overlay - Only show on Center Bridge */}
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

      {/* Scene Label */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-[#00d9ff] text-2xl font-bold pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.8)]">
        {sceneLabels[currentScene]}
      </div>

      {/* Silence Alarm Button - Only show on Center Bridge */}
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

      {/* Navigation Buttons */}
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

      <style jsx>{`
        @keyframes wave {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes flash {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes oceanMotion {
  0% {
    transform: translate(0px, 0px) rotate(0deg);
  }
  12.5% {
    transform: translate(1px, -2px) rotate(0.1deg);
  }
  25% {
    transform: translate(2.5px, -5px) rotate(0.25deg);
  }
  37.5% {
    transform: translate(3.5px, -7px) rotate(0.35deg);
  }
  50% {
    transform: translate(3px, -6px) rotate(0.3deg);
  }
  62.5% {
    transform: translate(2px, -4px) rotate(0.2deg);
  }
  75% {
    transform: translate(1px, -2px) rotate(0.1deg);
  }
  87.5% {
    transform: translate(-0.5px, 1px) rotate(-0.05deg);
  }
  100% {
    transform: translate(0px, 0px) rotate(0deg);
  }
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


        .bg-center-bottom {
          background-position: center bottom;
        }
      `}</style>
    </div>
  );
}