"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/useAuth";

// Páginas de negócio que o papel "designer" não deve acessar (mesmo
// digitando a URL direto), já que a Sidebar já esconde os links pra ele.
const ROTAS_BLOQUEADAS_DESIGNER = [
  "/crm-assessoria",
  "/crm-consultoria",
  "/crm-ascensao",
  "/crm-reputacao",
  "/analytics",
];

// O papel "cliente" só pode acessar o próprio Posicionamento de Valor —
// mesmo digitando outra URL direto, é redirecionado pra lá.
const ROTA_UNICA_CLIENTE = "/posicionamento";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, demoMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!demoMode && !loading && !profile) {
      router.replace("/login");
    }
  }, [demoMode, loading, profile, router]);

  useEffect(() => {
    if (
      profile?.papel === "designer" &&
      ROTAS_BLOQUEADAS_DESIGNER.some((rota) => pathname.startsWith(rota))
    ) {
      router.replace("/dashboard");
    }
  }, [profile, pathname, router]);

  useEffect(() => {
    if (profile?.papel === "cliente" && !pathname.startsWith(ROTA_UNICA_CLIENTE)) {
      router.replace(ROTA_UNICA_CLIENTE);
    }
  }, [profile, pathname, router]);

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

  if (
    profile?.papel === "designer" &&
    ROTAS_BLOQUEADAS_DESIGNER.some((rota) => pathname.startsWith(rota))
  ) {
    return null;
  }

  if (profile?.papel === "cliente" && !pathname.startsWith(ROTA_UNICA_CLIENTE)) {
    return null;
  }

  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">{children}</main>
    </div>
  );
}
