"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createClient();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const signOut = async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout failed:", error.message);
        setError(error.message);
        return;
      }

      router.replace("/home");
    };

    signOut();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        {error ? (
          <>
            <p className="text-red-600 font-medium">Logout failed</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </>
        ) : (
          <p className="text-gray-600">Logging you out…</p>
        )}
      </div>
    </div>
  );
}
