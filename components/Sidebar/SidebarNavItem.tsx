"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string | React.ReactNode;
  href: string;
  isActive?: boolean;
}

export function SidebarNavItem({
  icon: Icon,
  label,
  href,
  isActive = false,
}: SidebarNavItemProps) {
  return (
    <div className="relative">
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-gradient-to-b from-[#2e8bc0] to-[#4ecdc4]" />
      )}
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer",
          isActive
            ? "text-[#4ecdc4] bg-[rgba(78,205,196,0.1)] font-medium"
            : "text-[rgba(248,250,255,0.55)] hover:text-[rgba(248,250,255,0.9)] hover:bg-[rgba(255,255,255,0.06)]"
        )}
      >
        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
        {typeof label === "string" ? (
          <span className="text-[13.5px] font-medium whitespace-nowrap">{label}</span>
        ) : (
          <div className="text-[13.5px] font-medium whitespace-nowrap flex-1">{label}</div>
        )}
      </Link>
    </div>
  );
}