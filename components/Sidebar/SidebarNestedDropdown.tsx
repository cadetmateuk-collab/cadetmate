"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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

export function SidebarNestedDropdown({
  label,
  items,
  isActive,
}: SidebarNestedDropdownProps) {
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      {/* Parent */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-blue-50 text-blue-600"
            : "text-gray-700 hover:bg-gray-50"
        )}
      >
        {label}
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Children */}
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-2 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
