"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  href: string;
}

interface SidebarNestedDropdownProps {
  label: string;
  items: Item[];
  isActive?: boolean;
}

export function SidebarNestedDropdown({ label, items, isActive }: SidebarNestedDropdownProps) {
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between px-3 py-[7px] rounded-lg text-[13px] transition-all duration-150 cursor-pointer",
          isActive
            ? "text-[rgba(248,250,255,0.8)] font-medium"
            : "text-[rgba(248,250,255,0.45)] hover:text-[rgba(248,250,255,0.85)] hover:bg-[rgba(255,255,255,0.05)]"
        )}
      >
        <span>{label}</span>
        <ChevronRight
          className={cn(
            "h-3 w-3 opacity-40 transition-transform duration-200 flex-shrink-0",
            open && "rotate-90 opacity-70"
          )}
        />
      </button>

      {open && (
        <div className="ml-3 pl-3 border-l border-[rgba(255,255,255,0.06)] space-y-0.5 mt-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-[7px] text-[13px] rounded-lg transition-all duration-150
                         text-[rgba(248,250,255,0.45)] hover:text-[rgba(248,250,255,0.85)] hover:bg-[rgba(255,255,255,0.05)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}