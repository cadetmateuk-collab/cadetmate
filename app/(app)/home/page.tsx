"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  Trophy,
  Linkedin,
} from "lucide-react";
import Image from "next/image";
import type { SupabaseClient } from "@supabase/supabase-js";

// Types
interface Stats {
  totalUsers: number;
  activeUsers: number;
}

interface TopUser {
  full_name: string;
  total_time_seconds: number;
}

// Constants
const FEATURES = [
  "Interactive Modules",
  "Expert Content",
  "Progress Tracking",
  "Quiz System",
  "Certificates",
  "Community",
] as const;

const MEDAL_COLORS = {
  0: "bg-primary text-white",
  default: "bg-muted text-foreground",
} as const;

// Utility Functions
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Memoized Components
const FeatureItem = memo(({ item }: { item: string }) => (
  <div className="flex items-center gap-3">
    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
    <span className="text-base">{item}</span>
  </div>
));
FeatureItem.displayName = "FeatureItem";

const TopUserCard = memo(({ user, index }: { user: TopUser; index: number }) => (
  <div className="flex items-center gap-3" role="listitem">
    <div
      className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
        index === 0 ? MEDAL_COLORS[0] : MEDAL_COLORS.default
      }`}
      aria-label={`Rank ${index + 1}`}
    >
      {index + 1}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm truncate">
        {user.full_name || "Anonymous"}
      </div>
      <div className="text-xs text-muted-foreground">
        {formatTime(user.total_time_seconds || 0)}
      </div>
    </div>
    {index === 0 && (
      <Trophy className="h-4 w-4 text-primary flex-shrink-0" aria-label="Top performer" />
    )}
  </div>
));
TopUserCard.displayName = "TopUserCard";

// Main Component
export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
  });
  const [topTimeSpent, setTopTimeSpent] = useState<TopUser[]>([]);
  const [supabase] = useState<SupabaseClient>(() => createClient());

  const fetchStats = useCallback(async () => {
    try {
      const [totalUsersResult, activeUsersResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("user_statistics")
          .select("*", { count: "exact", head: true })
          .gte("last_activity_at", new Date(Date.now() - 3600000).toISOString()),
      ]);

      setStats({
        totalUsers: totalUsersResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [supabase]);

  const fetchTopTimeSpent = useCallback(async () => {
    try {
      const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabase
        .from("user_statistics")
        .select(
          `
          total_time_seconds,
          profiles!user_statistics_user_id_fkey (
            full_name
          )
        `
        )
        .gte("last_activity_date", weekAgoDate)
        .order("total_time_seconds", { ascending: false })
        .limit(3);

      if (error) throw error;

      setTopTimeSpent(
        data?.map((row: any) => ({
          full_name: row.profiles?.full_name ?? "Anonymous",
          total_time_seconds: row.total_time_seconds,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching top time spent:", error);
      setTopTimeSpent([]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStats();
    fetchTopTimeSpent();
  }, [fetchStats, fetchTopTimeSpent]);

  return (
    <>
      {/* SEO Meta Tags (use in layout or head) */}
      <div className="h-screen overflow-hidden bg-white">
        <div className="h-full flex">
          {/* Hero Section - 80% */}
          <section
            className="w-[80%] flex items-center justify-center p-12 relative"
            aria-label="Hero section"
          >
            <div className="max-w-5xl w-full grid grid-cols-[1.5fr_0.5fr] gap-6 items-center relative">
              {/* Text Content */}
              <div className="relative z-10">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full mb-6 text-sm font-medium"
                  role="status"
                  aria-label="Platform category"
                >
                  Maritime Training Platform
                </div>

                <h1 className="text-6xl font-semibold mb-6 leading-tight">
                  Master Your Maritime Career
                </h1>

                <p className="text-muted-foreground mb-8 text-xl leading-relaxed">
                  Comprehensive training modules, interactive quizzes, and expert
                  guidance to help you excel in your maritime journey.
                </p>

                <nav className="flex gap-4 mb-12" aria-label="Primary actions">
                  <button
                    className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 text-base"
                    aria-label="Start free training"
                  >
                    Get Started Free
                    <ArrowRight className="h-5 w-5 ml-2 inline" aria-hidden="true" />
                  </button>
                  <button
                    className="px-8 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-all duration-200 text-base"
                    aria-label="Watch platform demo"
                  >
                    Watch Demo
                  </button>
                </nav>

                {/* Features Section */}
                <section className="pt-8 border-t border-border">
                  <h2 className="font-semibold mb-5 text-lg">What We Include</h2>
                  <div
                    className="grid grid-cols-2 gap-4"
                    role="list"
                    aria-label="Platform features"
                  >
                    {FEATURES.map((item) => (
                      <FeatureItem key={item} item={item} />
                    ))}
                  </div>
                </section>
              </div>

              {/* Hero Image */}
              <div className="relative -mr-16 flex justify-center items-center">
                <div className="w-[clamp(500px,35vw,300px)] h-auto">
                <video
                  src="/images/captain-wave.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-contain"
                />
              </div>


              </div>
            </div>
          </section>

          {/* Sidebar - 20% */}
          <aside
            className="w-[20%] border-l border-border flex flex-col bg-muted/30"
            aria-label="Statistics and updates"
          >
            {/* Stats Bar */}
            <section
              className="flex items-center justify-between gap-6 px-6 py-4 border-b border-border bg-background"
              aria-label="User statistics"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-semibold" aria-label={`${stats.totalUsers} total users`}>
                  {stats.totalUsers}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="text-sm font-semibold" aria-label={`${stats.activeUsers} active users`}>
                  {stats.activeUsers}
                </span>
              </div>
            </section>

            {/* Top This Week */}
            <section className="p-6 border-b border-border bg-background">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="font-semibold">Top This Week</h2>
              </div>

              <div className="space-y-3" role="list" aria-label="Top users by time spent">
                {topTimeSpent.length > 0 ? (
                  topTimeSpent.map((user, idx) => (
                    <TopUserCard key={`${user.full_name}-${idx}`} user={user} index={idx} />
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground" role="status">
                    No activity this week
                  </div>
                )}
              </div>
            </section>

            {/* LinkedIn Feed */}
            <section className="flex-1 p-6 flex flex-col min-h-0 bg-background">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Latest Update</h2>
                <a
                  href="https://www.linkedin.com/company/cadetmate/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  aria-label="Follow CadetMate on LinkedIn"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                  Follow
                </a>
              </div>

              <div className="flex-1 border border-border rounded-lg overflow-hidden bg-white">
                <iframe
                  src="https://www.linkedin.com/embed/feed/update/urn:li:share:7423140746456825856"
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="CadetMate LinkedIn updates and news"
                  loading="lazy"
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}

// Suggested metadata for your layout.tsx or page.tsx:
/*
export const metadata = {
  title: "CadetMate - Master Your Maritime Career | Professional Training Platform",
  description: "Comprehensive maritime training platform with interactive modules, quizzes, and expert guidance. Join thousands of maritime professionals advancing their careers.",
  keywords: "maritime training, cadet training, maritime career, shipping courses, maritime education, marine certification",
  openGraph: {
    title: "CadetMate - Maritime Training Platform",
    description: "Professional maritime training with interactive modules and expert guidance",
    type: "website",
    url: "https://cadetmate.com",
    images: [
      {
        url: "/images/captain.png",
        width: 600,
        height: 600,
        alt: "Maritime training professional",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CadetMate - Maritime Training Platform",
    description: "Professional maritime training with interactive modules and expert guidance",
  },
};
*/