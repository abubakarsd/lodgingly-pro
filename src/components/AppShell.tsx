import { NavLink, useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { Bell, Building2, LayoutDashboard, LogOut, Settings, Wrench, User, FileText, MessageCircle, MessageSquare, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const studentNav = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/accommodation", label: "Accommodation", Icon: Building2 },
  { to: "/clearance", label: "Clearance", Icon: FileText },
  { to: "/complaints", label: "Complaints", Icon: MessageCircle },
  { to: "/messages", label: "Messages", Icon: MessageSquare },
];

const adminNav = [
  { to: "/admin", label: "Overview", Icon: LayoutDashboard },
  { to: "/hall-admins", label: "Hall Admins", Icon: ShieldCheck },
  { to: "/allocations", label: "Allocations", Icon: Building2 },
  { to: "/clearance", label: "Clearance", Icon: FileText },
  { to: "/notifications", label: "Broadcasts", Icon: Bell },
  { to: "/settings", label: "Settings", Icon: Settings },
];

const hallAdminNav = [
  { to: "/hall-dashboard", label: "Overview", Icon: LayoutDashboard },
  { to: "/accommodation", label: "My Hostel", Icon: Building2 },
  { to: "/clearance", label: "Clearance", Icon: FileText },
  { to: "/allocations", label: "Allocations", Icon: Building2 },
  { to: "/complaints", label: "Complaints", Icon: Wrench },
  { to: "/messages", label: "Messages", Icon: MessageSquare },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const { role, signOut, user } = useAuth();
  const nav = useNavigate();
  const items = role === "admin" ? adminNav : role === "hall_admin" ? hallAdminNav : studentNav;

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-white sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-border"><Logo /></div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {items.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-leaf-50 text-leaf-700" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`
              }>
              <Icon className="size-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs">
            <p className="font-medium truncate">{user?.email}</p>
            <p className="text-muted-foreground capitalize">{role}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={async () => { await signOut(); nav("/"); }}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">ABU Hostel</p>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/notifications" className={({ isActive }) => isActive ? "text-leaf-700" : "text-muted-foreground hover:text-foreground"}>
              <Button variant="ghost" size="icon"><Bell className="size-4" /></Button>
            </NavLink>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={async () => { await signOut(); nav("/"); }}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
