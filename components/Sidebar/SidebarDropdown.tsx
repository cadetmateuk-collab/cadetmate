"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label: string;
  href?: string;
  children?: DropdownItem[];
}

interface SidebarDropdownProps {
  icon: LucideIcon;
  label: string | React.ReactNode;
  items: DropdownItem[];
  isActive?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  openChildren: Record<string, boolean>;
  setOpenChildren: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function SidebarDropdown({
  icon: Icon,
  label,
  items,
  isActive = false,
  isOpen,
  onToggle,
  openChildren,
  setOpenChildren,
}: SidebarDropdownProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const toggleChild = (childLabel: string) =>
    setOpenChildren((prev) => ({ ...prev, [childLabel]: !prev[childLabel] }));

  return (
    <div className="space-y-0.5">
      {/* Parent button */}
      <div className="relative">
        {isActive && !isOpen && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-gradient-to-b from-[#2e8bc0] to-[#4ecdc4]" />
        )}
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer",
            isActive && !isOpen
              ? "text-[#4ecdc4] bg-[rgba(78,205,196,0.1)] font-medium"
              : "text-[rgba(248,250,255,0.55)] hover:text-[rgba(248,250,255,0.9)] hover:bg-[rgba(255,255,255,0.06)]"
          )}
        >
          <Icon className="h-[18px] w-[18px] flex-shrink-0" />
          {typeof label === "string" ? (
            <span className="text-[13.5px] font-medium flex-1 whitespace-nowrap">{label}</span>
          ) : (
            <div className="text-[13.5px] font-medium flex-1 whitespace-nowrap">{label}</div>
          )}
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 flex-shrink-0 opacity-40 transition-transform duration-200",
              isOpen && "rotate-90 opacity-70"
            )}
          />
        </button>
      </div>

      {/* Children */}
      {isOpen && (
        <div className="ml-3 pl-3 border-l border-[rgba(255,255,255,0.07)] space-y-0.5 pb-1">
          {items.map((item) => {
            const isItemActive  = item.href ? pathname === item.href : false;
            const isChildOpen   = openChildren[item.label];

            // Nested dropdown
            if (item.children) {
              const isChildActive = item.children.some((c) => pathname === c.href);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleChild(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-[7px] text-[13px] rounded-lg transition-all duration-150 cursor-pointer",
                      isChildActive
                        ? "text-[rgba(248,250,255,0.8)] font-medium"
                        : "text-[rgba(248,250,255,0.45)] hover:text-[rgba(248,250,255,0.85)] hover:bg-[rgba(255,255,255,0.05)]"
                    )}
                  >
                    <span>{item.label}</span>
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 opacity-40 transition-transform duration-200",
                        isChildOpen && "rotate-90 opacity-70"
                      )}
                    />
                  </button>

                  {isChildOpen && (
                    <div className="ml-3 pl-3 border-l border-[rgba(255,255,255,0.06)] space-y-0.5 mt-0.5">
                      {item.children.map(
                        (child) =>
                          child.href && (
                            <button
                              key={child.href}
                              onClick={() => router.push(child.href!)}
                              className={cn(
                                "w-full text-left px-3 py-[7px] text-[13px] rounded-lg transition-all duration-150",
                                pathname === child.href
                                  ? "text-[#4ecdc4] bg-[rgba(78,205,196,0.08)] font-medium"
                                  : "text-[rgba(248,250,255,0.45)] hover:text-[rgba(248,250,255,0.85)] hover:bg-[rgba(255,255,255,0.05)]"
                              )}
                            >
                              {child.label}
                            </button>
                          )
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Normal link
            return (
              item.href && (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href!)}
                  className={cn(
                    "w-full text-left px-3 py-[7px] text-[13px] rounded-lg transition-all duration-150",
                    isItemActive
                      ? "text-[#4ecdc4] bg-[rgba(78,205,196,0.08)] font-medium"
                      : "text-[rgba(248,250,255,0.45)] hover:text-[rgba(248,250,255,0.85)] hover:bg-[rgba(255,255,255,0.05)]"
                  )}
                >
                  {item.label}
                </button>
              )
            );
          })}
        </div>
      )}
    </div>
  );
}