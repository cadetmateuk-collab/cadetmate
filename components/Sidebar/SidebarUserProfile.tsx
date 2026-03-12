"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, LogOut, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarUserProfileProps {
  name: string;
  email: string;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

export function SidebarUserProfile({
  name,
  email,
  onSettingsClick,
  onLogoutClick,
}: SidebarUserProfileProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2e8bc0] to-[#4ecdc4] flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-[12px] font-bold text-[#0a1628]">{initials}</span>
        </div>

        {/* Name + email */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-[13px] font-medium text-white truncate leading-tight">{name}</p>
          <p className="text-[11px] text-[rgba(141,164,191,0.6)] truncate leading-tight">{email}</p>
        </div>

        <ChevronUp
          className={cn(
            "h-3.5 w-3.5 text-[rgba(248,250,255,0.3)] transition-transform flex-shrink-0",
            isMenuOpen && "rotate-180"
          )}
        />
      </button>

      {/* Popup menu */}
      {isMenuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0f2042] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden">
          <button
            onClick={() => { onSettingsClick?.(); setIsMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[rgba(248,250,255,0.65)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <div className="border-t border-[rgba(255,255,255,0.07)]" />
          <button
            onClick={() => { onLogoutClick?.(); setIsMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[rgba(248,100,100,0.7)] hover:text-[rgba(248,100,100,0.95)] hover:bg-[rgba(248,100,100,0.07)] transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}