'use client';

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';

export default function Home() {
  const [email, setEmail] = useState('');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [showGlow, setShowGlow] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      setShowGlow(true);
    };

    const handleMouseLeave = () => {
      setShowGlow(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      setGlowPos((prev) => ({
        x: prev.x + (cursorPos.x - prev.x) * 0.15,
        y: prev.y + (cursorPos.y - prev.y) * 0.15,
      }));
      requestAnimationFrame(animate);
    };
    animate();
  }, [cursorPos]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      alert("Thank you for signing up! We'll keep you posted.");
      setEmail('');
    }
  };

 const handleSurvey = () => {
  window.open(
    "https://docs.google.com/forms/d/e/1FAIpQLSeSPV5IeXMLPjL-NTQOc95YV_2tdDFT2xpxHTZAo0Iheyx_5A/viewform?usp=dialog",
    "_blank"
  );
};


  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#2250bd] to-[#2966f4] -z-20" />
      
      {/* Animated Blob */}
      <div className="fixed w-[800px] h-[800px] -bottom-[300px] -right-[200px] rounded-full bg-[radial-gradient(circle,rgba(255,140,0,0.15)_0%,transparent_70%)] -z-10 animate-float" />
      
      {/* Cursor Glow */}
      <div
        className="fixed w-[400px] h-[400px] rounded-full pointer-events-none z-10 transition-opacity duration-300 bg-[radial-gradient(circle,rgba(255,140,0,0.06)_0%,rgba(255,165,0,0.03)_30%,transparent_70%)]"
        style={{
          left: `${glowPos.x - 200}px`,
          top: `${glowPos.y - 200}px`,
          opacity: showGlow ? 1 : 0,
        }}
      />

      {/* Navigation */}
      <nav className="flex justify-between items-center px-[10%] py-8">
        <div className="flex items-center gap-2 text-white text-lg font-medium">
          <div className="relative h-13 w-13 flex items-center justify-center **:flex-shrink-0">
            <Image
              src="/images/c2.png"
              alt="Cadet Mate"
              fill
              className="object-contain"
              priority
            />
          </div>
          Cadet Mate
        </div>
        <a href="#" className="text-white text-base hover:opacity-80 transition-opacity">
          Home
        </a>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-[10%] pb-24 max-w-[1000px] w-full relative md:pb-16">
        <span className="text-[#ffa500] text-sm font-semibold uppercase tracking-[2px] mb-5 block">
          Coming Soon
        </span>
        
        <h1 className="text-white text-[clamp(36px,9vw,65px)] font-bold leading-[1.05] -tracking-[2.5px] mb-4">
          All-in-One<br />Platform for Cadets
        </h1>
        
        <p className="text-[#b8bcc4] text-[clamp(15px,2.5vw,17px)] leading-relaxed mb-4 max-w-[1000px]">
          We&apos;re building a simple online platform to help UK deck cadets pass
          their cadetship first time. It will include clear exam-focused lessons,
          MCA subjects, college support, TRB guidance, quizzes, flashcards,
          real-time sea advice and so much more - all explained in simple terms by
          people who&apos;ve been through it and now work in the industry. We&apos;re
          validating the idea and would love your input. Complete the survey to
          share your thoughts and sign up to our free newsletter to receive weekly
          tips and tricks as well as updates on the platform.
        </p>

        <div className="max-w-[500px] w-full">
          <button
            onClick={handleSurvey}
            className="mt-0 px-10 py-4 bg-gradient-to-br from-[#ff8c00] to-[#ffa500] text-[#0a1628] rounded-full text-[15px] font-bold cursor-pointer transition-all duration-300 tracking-[0.3px] hover:bg-gradient-to-br hover:from-[#ffa500] hover:to-[#ffb732] hover:scale-105 hover:shadow-[0_4px_16px_rgba(255,140,0,0.5)] active:scale-95"
          >
            Complete Survey
          </button>

          <form onSubmit={handleSubmit} className="relative flex items-center mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-[22px] py-4 pr-[140px] rounded-full bg-white/[0.08] backdrop-blur-[10px] text-[#e0e0e0] text-[clamp(14px,2vw,15px)] outline-none transition-all duration-300 border-none placeholder:text-white/30 focus:bg-white/[0.12] focus:shadow-[0_0_0_2px_rgba(255,140,0,0.3)] w-full"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-[30px] py-[11px] bg-transparent text-[#ffa500] border-2 border-[rgba(255,165,0,0.5)] rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 tracking-[0.3px] hover:bg-[rgba(255,165,0,0.1)] hover:border-[#ffa500] hover:scale-105 active:scale-95"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>

      {/* Hero Image - Desktop Only */}
      <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 w-[60%] z-[2]">
        <div className="w-full max-w-[1000px] mx-auto">
          <Image
            src="/images/cadetv2.png"
            alt="Maritime cadet at sea"
            width={1000}
            height={800}
            className="w-full h-auto object-cover"
            priority
          />
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-5 left-[10%] text-[10px] text-white font-extralight tracking-[0.5px] z-10">
        CadetMate 2026
      </div>
      <div className="fixed bottom-5 right-[10%] text-[10px] text-white font-extralight tracking-[0.5px] z-10">
        Coming Soon
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-20px, -20px) scale(1.05);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}