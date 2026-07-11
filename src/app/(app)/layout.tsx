"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/useAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, demoMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!demoMode && !loading && !profile) {
      router.replace("/login");
    }
  }, [demoMode, loading, profile, router]);

  if (!demoMode && loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-ink/50">
        Carregando...
      </div>
    );
  }

  if (!demoMode && !profile) {
    return null;
  }

  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
