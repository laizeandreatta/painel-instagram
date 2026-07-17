"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Image as ImageIcon,
  KanbanSquare,
  LayoutGrid,
  LineChart,
  LogOut,
  Palette,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { isSupabaseConfigured, createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Calendário & Kanban", icon: KanbanSquare },
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

export function Sidebar() {
  const pathname = usePathname();
  const { profile, demoMode } = useAuth();
  const router = useRouter();

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
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-line bg-off-white px-5 py-7">
      <div className="mb-10 px-1">
        <p className="font-editorial text-2xl font-semibold tracking-tight text-ink">
          Dashboard
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-wine">
          Laize Andreatta
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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
  );
}
