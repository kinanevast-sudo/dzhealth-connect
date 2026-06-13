import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, User, Map as MapIcon, Plus } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const is = (p: string) => pathname === p;

  const Tab = ({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) => (
    <Link to={to} className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition-colors">
      <Icon className={`h-5 w-5 ${is(to) ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2.2} />
      <span className={is(to) ? "text-primary font-semibold" : "text-muted-foreground"}>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-[100dvh] pb-24">
      {children}
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 glass border-t border-border/60 px-2">
        <div className="flex items-end justify-between">
          <Tab to="/home" icon={Home} label="الرئيسية" />
          <Tab to="/search" icon={Search} label="بحث" />
          <Link to="/add" className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-primary-foreground neon-glow animate-pulse-glow">
            <Plus className="h-7 w-7" strokeWidth={2.6} />
          </Link>
          <Tab to="/profile" icon={User} label="الملف" />
          <Tab to="/map" icon={MapIcon} label="الخريطة" />
        </div>
      </nav>
    </div>
  );
}

export function ScreenHeader({ title, back = true }: { title: string; back?: boolean }) {
  return (
    <header className="sticky top-0 z-30 glass flex items-center justify-between px-4 py-3 border-b border-border/50">
      {back ? (
        <Link to="/home" className="rounded-full p-2 hover:bg-surface-2">
          <span className="block h-5 w-5">→</span>
        </Link>
      ) : <span className="w-9" />}
      <h1 className="text-base font-bold">{title}</h1>
      <span className="w-9" />
    </header>
  );
}
