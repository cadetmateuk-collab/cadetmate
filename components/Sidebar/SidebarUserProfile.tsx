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
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
      >
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-white">{initials}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>
        <ChevronUp
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform flex-shrink-0",
            isMenuOpen && "rotate-180"
          )}
        />
      </button>

      {isMenuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => {
              onSettingsClick?.();
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => {
              onLogoutClick?.();
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-t border-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}