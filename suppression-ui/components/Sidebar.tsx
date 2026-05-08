"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { toggleTheme, getStoredTheme } from "@/lib/theme";
import {
  LayoutDashboard,
  Rocket,
  History,
  FileText,
  Eye,
  MousePointerClick,
  Shield,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown ,
  LogOut,
  Sun,
  Moon,
  Mail,
  Send,
  Download,
  Users, 
  Split,
  Combine,
  Scissors,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  requiredPermission?: string;
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
      { href: "/campaigns/live-ready", label: "Live Ready Dashboard", icon: LayoutDashboard, requiredPermission: "campaign.view" },
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
    title: "Moniter PMTA",
    items: [
      { href: "/pmta/stats", label: "PMTA STATS", icon: Eye, requiredPermission: "campaign.view" },
    ],
  },

  {
    title: "Admin",
    items: [
      { href: "/admin/users", label: "Users", icon: FileText, requiredPermission: "admin.users" },
      { href: "/admin/roles", label: "Roles", icon: Shield, requiredPermission: "admin.roles" },
      { href: "/admin/permissions", label: "Permissions", icon: Shield, requiredPermission: "admin.permissions" },
      { href: "/admin/senders", label: "Senders", icon: Rocket, requiredPermission: "admin.senders" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
const toggleSection = (title: string) => {
  setOpenSections((prev) => ({
    ...prev,
    [title]: !prev[title],
  }));
};

  useEffect(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored === "true") setCollapsed(true);

    const theme = getStoredTheme();
    setDark(theme === "dark");
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setDark(!dark);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      item.requiredPermission
        ? user?.permissions?.includes(item.requiredPermission)
        : true
    ),
  })).filter((s) => s.items.length > 0);

  return (
    <aside
      className={`
        ${collapsed ? "w-20" : "w-72"}
        transition-all duration-300 ease-in-out
        border-r border-border/60
        bg-background/80 backdrop-blur-xl
        flex flex-col
      `}
    >
      {/* HEADER */}
      <div className="px-5 py-6 border-b border-border/60">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Email Ops
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Internal Console
              </p>
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg hover:bg-muted/40 transition"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {!collapsed && user && (
          <div className="mt-6 p-4 rounded-2xl bg-muted/40 border border-border/60 text-sm">
            <div className="font-medium truncate">{user.email}</div>
            <div className="text-xs text-muted-foreground mt-1">
              UID: {user.userId}
            </div>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {filteredSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                {section.title}

                {openSections[section.title] ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            )}

            {(collapsed || openSections[section.title]) && (
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${
                        active
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      className={active ? "text-primary" : "opacity-80 group-hover:opacity-100"}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
            )}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-border/60 space-y-3">
        <button
          onClick={handleThemeToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm border border-border/60 bg-muted/30 hover:bg-muted/50 transition"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && (dark ? "Light Mode" : "Dark Mode")}
        </button>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm bg-red-600/90 text-white hover:bg-red-600 transition disabled:opacity-60"
        >
          <LogOut size={16} />
          {!collapsed && (loggingOut ? "Logging out..." : "Logout")}
        </button>
      </div>
    </aside>
  );
}