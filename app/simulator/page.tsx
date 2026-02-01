'use client';

import { useState } from 'react';
import Image from 'next/image';

type Scene = 'port' | 'center' | 'starboard';

export default function ShipBridgeSimulator() {
  const [currentScene, setCurrentScene] = useState<Scene>('center');

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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      {/* Ocean Background */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-[1]"
          style={{ backgroundImage: "url('/shipimages/Ocean3.png')" }}
        />
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-[2] animate-wave"
          style={{ backgroundImage: "url('/shipimages/ocean4.png')" }}
        />
      </div>

      {/* Horizon Objects (Ships) */}
      <div className="absolute top-[30%] left-0 w-full h-[20%] z-[3] pointer-events-none">
        <img
          src="/shipimages/pdv_stbd_over50m_underway_day.png"
          alt="Ship on horizon"
          className="absolute top-1/2 -translate-y-1/2 h-[50px] transition-[left] duration-500 ease-out"
          style={{ left: shipPositions[currentScene] }}
        />
      </div>

      {/* Bridge Overlay */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full max-w-screen max-h-screen z-10 pointer-events-none bg-contain bg-center-bottom bg-no-repeat"
        style={{ backgroundImage: `url('${bridgeImages[currentScene]}')` }}
      />

      {/* Scene Label */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-[#00d9ff] text-2xl font-bold pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.8)]">
        {sceneLabels[currentScene]}
      </div>

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

        .animate-wave {
          animation: wave 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }

        .bg-center-bottom {
          background-position: center bottom;
        }
      `}</style>
    </div>
  );
}