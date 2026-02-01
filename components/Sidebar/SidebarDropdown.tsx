"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
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

  const toggleChild = (childLabel: string) => {
    setOpenChildren((prev) => ({
      ...prev,
      [childLabel]: !prev[childLabel],
    }));
  };

  return (
    <div className="space-y-1">
      {/* Parent Dropdown Button */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer",
          isActive 
            ? "bg-accent text-accent-foreground" 
            : "text-card-foreground hover:bg-muted"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="h-5 w-5 flex-shrink-0" />
          {typeof label === 'string' ? (
            <span className="text-sm font-medium whitespace-nowrap">{label}</span>
          ) : (
            <div className="text-sm font-medium whitespace-nowrap flex-1">{label}</div>
          )}
        </div>
        <ChevronRight
          className={cn("h-4 w-4 transition-transform flex-shrink-0", isOpen && "rotate-90")}
        />
      </button>

      {/* Dropdown Items */}
      {isOpen && (
        <div className="ml-8 space-y-0.5 mt-1">
          {items.map((item) => {
            const isItemActive = item.href && pathname === item.href;
            const isChildOpen = openChildren[item.label];

            // Nested dropdown
            if (item.children) {
              const isChildActive = item.children.some((child) => pathname === child.href);

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleChild(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors",
                      isChildActive
                        ? "text-accent-foreground bg-accent font-medium"
                        : "text-card-foreground hover:bg-muted"
                    )}
                  >
                    <span>{item.label}</span>
                    <ChevronRight
                      className={cn("h-4 w-4 transition-transform", isChildOpen && "rotate-90")}
                    />
                  </button>

                  {isChildOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l pl-3 border-border">
                      {item.children.map(
                        (child) =>
                          child.href && (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "block px-3 py-1.5 text-sm rounded-md transition-colors",
                                pathname === child.href
                                  ? "text-accent-foreground bg-accent font-medium"
                                  : "text-card-foreground hover:bg-muted"
                              )}
                            >
                              {child.label}
                            </Link>
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
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 text-sm rounded-lg transition-all",
                    isItemActive
                      ? "text-accent-foreground bg-accent font-medium"
                      : "text-card-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              )
            );
          })}
        </div>
      )}
    </div>
  );
}