"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Image as ImageIcon,
  KanbanSquare,
  LayoutGrid,
  LineChart,
  LogOut,
  Menu,
  Palette,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { isSupabaseConfigured, createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Conteúdos", icon: KanbanSquare },
  { href: "/feed", label: "Feed", icon: LayoutGrid },
  { href: "/crm-assessoria", label: "CRM Assessoria", icon: Users },
  { href: "/fotos", label: "Minhas fotos", icon: ImageIcon },
  { href: "/identidade-visual", label: "Identidade Visual", icon: Palette },
  { href: "/analytics", label: "Desempenho", icon: LineChart },
];

// O papel "designer" só cuida da parte visual do trabalho, então some com as
// abas de negócio (CRM Assessoria e Desempenho) para esse papel.
const LINKS_PERMITIDOS_DESIGNER = new Set([
  "/dashboard",
  "/feed",
  "/fotos",
  "/identidade-visual",
]);

function NavLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: typeof LINKS;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-wine text-off-white shadow-sm"
                : "text-ink/70 hover:bg-baby-pink-light hover:text-ink"
            )}
          >
            <Icon size={17} strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { profile, demoMode } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links =
    profile?.papel === "designer"
      ? LINKS.filter((link) => LINKS_PERMITIDOS_DESIGNER.has(link.href))
      : LINKS;

  async function sair() {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
  }

  return (
    <>
      {/* Barra superior do celular — a barra lateral fica escondida em telas
          pequenas, então esse é o único jeito de navegar no celular. */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-line bg-off-white px-4 py-3 md:hidden">
        <div>
          <p className="font-editorial text-lg font-semibold tracking-tight text-ink">
            Dashboard
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-wine">
            Laize Andreatta
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="text-ink/70"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Menu do celular — abre por cima da tela ao tocar no ícone acima. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-off-white p-5 shadow-xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="font-editorial text-xl font-semibold tracking-tight text-ink">
                  Dashboard
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-wine">
                  Laize Andreatta
                </p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="text-ink/60"
              >
                <X size={20} />
              </button>
            </div>

            <NavLinks
              links={links}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />

            {demoMode && (
              <div className="mb-4 mt-4 rounded-lg border border-baby-pink bg-baby-pink-light px-3 py-2.5 text-xs text-bordeaux">
                Modo demonstração — dados de exemplo. Conecte o Supabase
                para usar com sua equipe de verdade.
              </div>
            )}

            <div className="mt-4 flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-wine text-xs font-semibold text-off-white">
                {profile?.nome?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {profile?.nome ?? "..."}
                </p>
                <p className="truncate text-xs text-ink/50">
                  {profile?.papel}
                </p>
              </div>
              <button
                onClick={sair}
                title="Sair"
                className="text-ink/40 hover:text-wine"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra lateral — computador */}
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-line bg-off-white px-5 py-7">
        <div className="mb-10 px-1">
          <p className="font-editorial text-2xl font-semibold tracking-tight text-ink">
            Dashboard
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-wine">
            Laize Andreatta
          </p>
        </div>

        <NavLinks links={links} pathname={pathname} />

        {demoMode && (
          <div className="mb-4 rounded-lg border border-baby-pink bg-baby-pink-light px-3 py-2.5 text-xs text-bordeaux">
            Modo demonstração — dados de exemplo. Conecte o Supabase para
            usar com sua equipe de verdade.
          </div>
        )}

        <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-wine text-xs font-semibold text-off-white">
            {profile?.nome?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {profile?.nome ?? "..."}
            </p>
            <p className="truncate text-xs text-ink/50">{profile?.papel}</p>
          </div>
          <button
            onClick={sair}
            title="Sair"
            className="text-ink/40 hover:text-wine"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
