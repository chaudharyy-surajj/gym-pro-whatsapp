"use client";
import { Users, MessageSquare, PieChart, Settings, Home, Calendar, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

const navItems = [
  { icon: Home,          label: "Dashboard",   href: "/" },
  { icon: Users,         label: "Members",      href: "/members" },
  { icon: MessageSquare, label: "WhatsApp Bot", href: "/whatsapp" },
  { icon: Calendar,      label: "Attendance",   href: "/attendance" },
  { icon: PieChart,      label: "Analytics",    href: "/analytics" },
  { icon: Settings,      label: "Settings",     href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className="w-64 h-screen flex flex-col flex-shrink-0 transition-colors duration-300 border-r"
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
            <img 
              src="/gravity-fitness-icon.svg" 
              alt="Gravity Fitness" 
              className="w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold leading-tight truncate" style={{ color: "var(--foreground)" }}>
              Gravity Fitness
            </p>
            <p className="text-[10px] font-medium leading-tight" style={{ color: "var(--foreground-muted)" }}>
              Unisex Gym
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
              style={{
                backgroundColor: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#ffffff" : "var(--foreground-muted)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)";
                  (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--foreground-muted)";
                }
              }}
            >
              <item.icon
                className="w-[18px] h-[18px] flex-shrink-0"
                style={{ color: "inherit" }}
              />
              <span className="font-semibold text-sm" style={{ color: "inherit" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 space-y-2 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
          style={{ backgroundColor: "transparent", color: "var(--foreground-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)";
            (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--foreground-muted)";
          }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-[18px] h-[18px] text-yellow-400" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-blue-500" />
          )}
          <span className="font-semibold text-sm" style={{ color: "inherit" }}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* WhatsApp Status */}
        <div
          className="p-3 rounded-xl border"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
              WhatsApp connected
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
            Bot is actively monitoring
          </p>
        </div>
      </div>
    </aside>
  );
}
