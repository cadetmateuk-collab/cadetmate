import { CadetMateSidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      
      {/* Sidebar */}
      <CadetMateSidebar />

      {/* Right side - Add pt-16 on mobile to account for fixed navbar */}
      <div className="flex flex-col flex-1 min-w-0 pt-16 lg:pt-0">
        
        {/* Header (add later if needed) */}
        {/* <AppHeader /> */}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
          {children}
        </main>

        {/* Footer (optional) */}
        {/* <AppFooter /> */}

      </div>
    </div>
  );
}