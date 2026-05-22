"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import {
  LayoutDashboard,
  Rocket,
  History,
  FileText,
  Eye,
  MousePointerClick,
  Shield,
  Database,
  ChevronDown,
  LogOut,
  Mail,
  Send,
  Download,
  Users,
  Split,
  Combine,
  Scissors,
  Key,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  requiredPermission?: string;
  hideForAdmin?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, requiredPermission: "campaign.view" },
      { href: "/leads", label: "Website Leads", icon: Users, requiredPermission: "reports.view" },
      { href: "/request-access", label: "Request Access", icon: Key, hideForAdmin: true },
    ],
  },
  {
    title: "Deploy",
    items: [
      { href: "/deploy", label: "Deploy", icon: Download, requiredPermission: "deploy.run" },
      { href: "/deploy/history", label: "Deploy History", icon: History, requiredPermission: "deploy.viewhistory" },
    ],
  },
  {
    title: "Campaigns",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: Mail, requiredPermission: "campaign.view" },
      { href: "/campaigns/live-ready", label: "Live Dashboard", icon: LayoutDashboard, requiredPermission: "campaign.view" },
      { href: "/campaigns/triggers", label: "Campaign Triggers", icon: Zap, requiredPermission: "campaign.view" },
      { href: "/campaigns/create", label: "Create Campaign", icon: Send, requiredPermission: "campaign.create" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/offers", label: "Offers", icon: FileText, requiredPermission: "offer.view" },
    ],
  },
  {
    title: "Tracking",
    items: [
      { href: "/logs", label: "Overview", icon: LayoutDashboard, requiredPermission: "reports.view" },
      { href: "/logs/opens", label: "Open Logs", icon: Eye, requiredPermission: "reports.view" },
      { href: "/logs/clicks", label: "Click Logs", icon: MousePointerClick, requiredPermission: "reports.view" },
      { href: "/reports/sender", label: "Reports", icon: FileText, requiredPermission: "reports.view" },
      { href: "/reports/sender-performance", label: "Sender Performance", icon: FileText, requiredPermission: "reports.view" },
    ],
  },
  {
    title: "Suppression",
    items: [
      { href: "/suppression", label: "Run Suppression", icon: Shield, requiredPermission: "suppression.view" },
      { href: "/suppression/history", label: "Suppression History", icon: History, requiredPermission: "suppression.view" },
      { href: "/suppression/md5", label: "MD5 Sync", icon: Database, requiredPermission: "suppression.manage" },
    ],
  },
  {
    title: "Segments",
    items: [
      { href: "/segments", label: "Segments", icon: Users, requiredPermission: "campaign.view" },
      { href: "/segments/create", label: "Create Segment", icon: Database, requiredPermission: "campaign.view" },
      { href: "/segments/combine", label: "Combine", icon: Combine, requiredPermission: "campaign.view" },
      { href: "/segments/split", label: "Split", icon: Split, requiredPermission: "campaign.view" },
      { href: "/segments/trim", label: "Trim", icon: Scissors, requiredPermission: "campaign.view" },
    ],
  },
  {
    title: "Monitor",
    items: [
      { href: "/pmta/stats", label: "PMTA Stats", icon: Eye, requiredPermission: "campaign.view" },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin/users", label: "Users", icon: FileText, requiredPermission: "user.view" },
      { href: "/admin/roles", label: "Roles", icon: Shield, requiredPermission: "role.view" },
      { href: "/admin/permissions", label: "Permissions", icon: Shield, requiredPermission: "permission.view" },
      { href: "/admin/senders", label: "Senders", icon: Rocket, requiredPermission: "sender.view" },
      { href: "/admin/triggers", label: "Triggers", icon: Send, requiredPermission: "sender.view" },
      { href: "/admin/test-ids", label: "Test IDs", icon: Shield, requiredPermission: "role.view" },
      { href: "/admin/requests", label: "Access Requests", icon: Shield, requiredPermission: "role.view" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Main: true,
    Campaigns: true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const isAdmin = user?.permissions?.includes("role.view") || user?.permissions?.includes("*");

  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      const hasPerm = item.requiredPermission ? hasPermission(item.requiredPermission) : true;
      const shouldHide = item.hideForAdmin && isAdmin;
      return hasPerm && !shouldHide;
    }),
  })).filter((s) => s.items.length > 0);

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "h-full bg-surface border-r border-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* LOGO */}
      <div className="h-14 flex items-center px-4 border-b border-border mb-4">
        <div className="w-9 h-9 bg-gradient-to-br from-primary to-cyan rounded-xl flex items-center justify-center font-extrabold text-sm shadow-[0_0_15px_rgba(99,130,255,0.4)] text-white shrink-0">
          EC
        </div>
        {!collapsed && (
          <div className="ml-3 flex flex-col">
            <span className="text-sm font-bold tracking-tight">EmailCore</span>
            <span className="text-[10px] text-text-muted font-mono uppercase">Internal Console</span>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-hide" aria-label="Sidebar navigation">
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                aria-expanded={!!openSections[section.title]}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-foreground transition-colors"
              >
                {section.title}
                <ChevronDown size={12} className={cn("transition-transform", !openSections[section.title] && "-rotate-90")} />
              </button>
            )}

            {(collapsed || openSections[section.title]) && (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative",
                        active 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-text-secondary hover:bg-hover hover:text-foreground"
                      )}
                    >
                      <Icon size={18} className={cn(active ? "text-primary" : "opacity-70 group-hover:opacity-100")} />
                      {!collapsed && <span>{item.label}</span>}
                      {active && (
                        <div className="absolute left-[-8px] w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_var(--accent-indigo)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="p-2 border-t border-border space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-xl bg-panel/50 border border-border text-[11px] mb-2">
            <div className="font-bold truncate text-foreground">{user.email}</div>
            <div className="text-text-muted font-mono mt-0.5 uppercase tracking-tighter">UID: {user.userId}</div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm bg-rose/10 text-rose border border-rose/20 hover:bg-rose/20 transition-all disabled:opacity-60"
        >
          <LogOut size={16} />
          {!collapsed && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-text-muted hover:text-foreground hover:bg-hover transition-colors"
        >
          {collapsed ? <Rocket size={16} /> : <div className="text-[10px] font-bold uppercase tracking-widest">Collapse Sidebar</div>}
        </button>
      </div>
    </aside>
  );
}