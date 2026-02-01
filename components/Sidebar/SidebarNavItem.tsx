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
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {typeof label === 'string' ? (
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      ) : (
        <div className="text-sm font-medium whitespace-nowrap flex-1">{label}</div>
      )}
    </Link>
  );
}