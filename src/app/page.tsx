"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Users, Cake, Receipt, Activity, Bell, X,
  CheckCircle2, Clock, Phone, Calendar, Loader2,
  UserX, IndianRupee, PieChart
} from "lucide-react";
import ExpensesModal from "@/components/ExpensesModal";

// ── Types ────────────────────────────────────────────────────
type PanelKey = "members" | "fees" | "birthdays" | "attendance" | null;

interface MemberRow { id: number; name: string; phone: string; plan: string | null; status: string; membershipEnd?: string | null; }
interface FeeRow    { id: number; name: string; phone: string; plan: string | null; feeDueDate: string | null; amountPaid?: number | null; }
interface BdayRow   { id: number; name: string; phone: string; plan: string | null; birthday: string | null; }
interface AttRow    { id: number; name: string; phone: string; plan: string | null; lastAttendance: string | null; }

interface DashStats {
  totalMembers: number;
  feesPending: number;
  birthdaysToday: number;
  attendanceToday: number;
  totalRevenue: number;
  totalExpenses: number;
  netRevenue: number;
  chartData: Array<{ month: string; revenue: number }>;
  allMembersList: MemberRow[];
  feesPendingList: FeeRow[];
  birthdaysList: BdayRow[];
  attendanceList: AttRow[];
  recentActivity: Array<{ id: number; name: string; type: string; time: string; amount: string | null }>;
}

// ── Helpers ──────────────────────────────────────────────────
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function planBadge(plan: string | null) {
  if (!plan) return "—";
  const map: Record<string, string> = { MONTHLY: "Monthly", QUARTERLY: "Quarterly", ANNUAL: "Annual" };
  return map[plan] ?? plan;
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <UserX className="w-10 h-10 opacity-20" style={{ color: "var(--foreground-muted)" }} />
      <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>No {label} right now</p>
    </div>
  );
}

// ── Panel components (live data) ─────────────────────────────
function MembersPanel({ members }: { members: MemberRow[] }) {
  if (!members.length) return <EmptyState label="active members" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--card-border)" }}>
            {["Member", "Phone", "Plan", "Status", "Expires"].map((h) => (
              <th key={h} className="pb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b transition-colors" style={{ borderColor: "var(--card-border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--table-row-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20 flex-shrink-0">
                    {initials(m.name)}
                  </div>
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>{m.name}</span>
                </div>
              </td>
              <td className="py-3 pr-4" style={{ color: "var(--foreground-muted)" }}>{m.phone}</td>
              <td className="py-3 pr-4" style={{ color: "var(--foreground-muted)" }}>{planBadge(m.plan)}</td>
              <td className="py-3 pr-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  m.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : 
                  m.status === "DUE" ? "bg-orange-500/10 text-orange-500" : 
                  "bg-red-500/10 text-red-500"
                }`}>
                  {m.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />} {m.status}
                </span>
              </td>
              <td className="py-3" style={{ color: "var(--foreground-muted)" }}>{fmtDate(m.membershipEnd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeesPanel({ fees }: { fees: FeeRow[] }) {
  if (!fees.length) return <EmptyState label="upcoming renewals" />;
  return (
    <div className="space-y-3">
      {fees.map((f) => (
        <div key={f.id} className="flex items-center gap-4 p-4 rounded-xl transition-all"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>{f.name}</p>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{f.phone} · {planBadge(f.plan)}</p>
          </div>
          <div className="text-right flex-shrink-0 flex items-center h-full">
            <p className="text-sm font-bold text-orange-500 flex items-center gap-1.5 justify-end">
              <Clock className="w-4 h-4" /> Due {fmtDate(f.feeDueDate)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BirthdaysPanel({ members }: { members: BdayRow[] }) {
  if (!members.length) return <EmptyState label="birthdays today" />;
  return (
    <div className="space-y-3">
      {members.map((b) => (
        <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl transition-all"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
          <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0 text-xl">🎂</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>{b.name}</p>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{b.phone} · {planBadge(b.plan)}</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-pink-500">
            <Calendar className="w-3 h-3" /> {fmtDate(b.birthday)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AttendancePanel({ members }: { members: AttRow[] }) {
  if (!members.length) return <EmptyState label="attendance today" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--card-border)" }}>
            {["#", "Member", "Phone", "Plan", "Check-In"].map((h) => (
              <th key={h} className="pb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((a, i) => (
            <tr key={a.id} className="border-b transition-colors" style={{ borderColor: "var(--card-border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--table-row-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
              <td className="py-3 pr-4 text-xs" style={{ color: "var(--foreground-muted)" }}>{i + 1}</td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-xs flex-shrink-0">
                    {initials(a.name)}
                  </div>
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>{a.name}</span>
                </div>
              </td>
              <td className="py-3 pr-4" style={{ color: "var(--foreground-muted)" }}>{a.phone}</td>
              <td className="py-3 pr-4" style={{ color: "var(--foreground-muted)" }}>{planBadge(a.plan)}</td>
              <td className="py-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500">
                  <Activity className="w-3 h-3" /> {fmtTime(a.lastAttendance)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Slide-over Drawer ────────────────────────────────────────
function Drawer({
  title, subtitle, icon, color, children, onClose,
}: {
  title: string; subtitle: string; icon: React.ReactNode; color: string;
  children: React.ReactNode; onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "var(--overlay-bg)" }} onClick={onClose} />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-2xl z-50 flex flex-col shadow-2xl"
        style={{
          backgroundColor: "var(--drawer-bg)",
          borderLeft: "1px solid var(--drawer-border)",
          animation: "slideIn 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0" style={{ borderColor: "var(--drawer-border)" }}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color} bg-current/10`} style={{ backgroundColor: "transparent" }}>
              <span className={color}>{icon}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{title}</h2>
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:opacity-70"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)", color: "var(--foreground-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
      </div>
    </>
  );
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, trend, loading, onClick,
}: {
  label: string; value: number | undefined; icon: React.ComponentType<any>;
  color: string; trend: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-6 rounded-2xl group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40 w-full"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card-hover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card)"; }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl`} style={{ backgroundColor: "var(--badge-bg)" }}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: "var(--badge-bg)", color: "var(--foreground-muted)" }}>
          {trend}
        </span>
      </div>
      <h3 className="text-3xl font-black mb-1" style={{ color: "var(--foreground)" }}>
        {loading ? (
          <span className="inline-block w-16 h-8 rounded-lg skeleton-pulse" style={{ backgroundColor: "var(--badge-bg)" }} />
        ) : (
          (value ?? 0).toLocaleString()
        )}
      </h3>
      <p className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>{label}</p>
      <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
        Click to view details →
      </p>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function Home() {
  const [activePanel, setActivePanel] = useState<PanelKey>(null);
  const [stats, setStats]   = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expensesModalOpen, setExpensesModalOpen] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) setStats(await res.json());
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { key: "members" as PanelKey,    label: "Total Members",     value: stats?.totalMembers,    icon: Users,    color: "text-blue-500",   trend: "Total" },
    { key: "fees" as PanelKey,       label: "Due Members",       value: stats?.feesPending,     icon: Receipt,  color: "text-orange-500", trend: "Payment Due" },
    { key: "birthdays" as PanelKey,  label: "Today's Birthdays", value: stats?.birthdaysToday,  icon: Cake,     color: "text-pink-500",   trend: "Today" },
    { key: "attendance" as PanelKey, label: "Daily Attendance",  value: stats?.attendanceToday, icon: Activity, color: "text-green-500",  trend: "Today" },
  ];

  function renderPanel() {
    if (!activePanel || !stats) return null;
    if (activePanel === "members")    return <MembersPanel members={stats.allMembersList} />;
    if (activePanel === "fees")       return <FeesPanel fees={stats.feesPendingList} />;
    if (activePanel === "birthdays")  return <BirthdaysPanel members={stats.birthdaysList} />;
    if (activePanel === "attendance") return <AttendancePanel members={stats.attendanceList} />;
  }

  const panelMeta: Record<NonNullable<PanelKey>, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
    members:    { title: "Active Members",    subtitle: "All currently active gym members",       icon: <Users className="w-5 h-5" />,    color: "text-blue-500" },
    fees:       { title: "Fees Pending",      subtitle: "Members with fees due in the next 7 days", icon: <Receipt className="w-5 h-5" />,  color: "text-orange-500" },
    birthdays:  { title: "Today's Birthdays", subtitle: "Members celebrating today",              icon: <Cake className="w-5 h-5" />,     color: "text-pink-500" },
    attendance: { title: "Daily Attendance",  subtitle: "Today's check-in log",                  icon: <Activity className="w-5 h-5" />, color: "text-green-500" },
  };

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--background)" }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>{greeting}, Admin 👋</h1>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Gravity Fitness Unisex Gym — here&apos;s your overview for today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpensesModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all font-inter"
            >
              <IndianRupee className="w-4 h-4" /> Manage Expenses
            </button>
            <button
              className="p-2.5 rounded-xl relative transition-colors"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
            >
              <Bell className="w-5 h-5" style={{ color: "var(--foreground-muted)" }} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="text-primary font-bold text-sm">GA</span>
            </div>
          </div>
        </header>

        {/* Stat Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {statCards.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              loading={loading}
              onClick={() => setActivePanel(stat.key)}
            />
          ))}
        </section>

        {/* Charts + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div
            className="lg:col-span-2 p-7 rounded-2xl"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Revenue Overview</h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Monthly fee collection</p>
                  <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                    <PieChart className="w-3 h-3" /> Expenses: ₹{stats?.totalExpenses?.toLocaleString() ?? "0"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>Net Revenue</p>
                <p className="text-2xl font-black text-primary">₹{stats?.netRevenue?.toLocaleString() ?? "0"}</p>
              </div>
            </div>
            <div className="flex items-end gap-3 h-48">
              {stats?.chartData?.length ? stats.chartData.map((d, i) => {
                const max = Math.max(...stats.chartData.map(x => x.revenue), 1);
                const h = max > 0 ? (d.revenue / max) * 100 : 0;
                const displayHeight = Math.max(h, 8); // Minimum 8% height for visibility
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div
                      className="w-full rounded-t-lg transition-all cursor-pointer relative"
                      style={{ 
                        height: `${displayHeight}%`,
                        background: d.revenue > 0 
                          ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.9) 0%, rgba(99, 102, 241, 0.6) 100%)'
                          : 'rgba(99, 102, 241, 0.2)',
                        boxShadow: d.revenue > 0 ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                      }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                        <div className="font-bold">₹{d.revenue.toLocaleString()}</div>
                        <div className="text-[10px] opacity-75">{d.month}</div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{d.month}</span>
                  </div>
                );
              }) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <PieChart className="w-12 h-12 opacity-20" style={{ color: "var(--foreground-muted)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>No revenue data yet</p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Add members and payments to see the chart</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="p-7 rounded-2xl"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <h2 className="text-lg font-bold mb-6" style={{ color: "var(--foreground)" }}>Recent Activity</h2>
            <div className="space-y-4">
              {stats?.recentActivity?.length ? stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                    {a.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>{a.name}</p>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{a.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{fmtDate(a.time)}</p>
                    {a.amount && <p className="text-xs font-bold text-primary">₹{a.amount}</p>}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-theme-muted italic py-5">No recent activity</p>
              )}
            </div>
            <button
              className="w-full mt-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ backgroundColor: "var(--badge-bg)", color: "var(--foreground-muted)", border: "1px solid var(--card-border)" }}
            >
              View All Logs
            </button>
          </div>
        </div>
      </main>

      {/* Panel Drawer */}
      {activePanel && (
        <Drawer
          {...panelMeta[activePanel]}
          onClose={() => setActivePanel(null)}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3" style={{ color: "var(--foreground-muted)" }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : renderPanel()}
        </Drawer>
      )}

      {/* Expenses Modal */}
      {expensesModalOpen && (
        <ExpensesModal onClose={() => {
          setExpensesModalOpen(false);
          // Refresh stats after modal closes
          fetch("/api/dashboard/stats").then(res => res.json()).then(setStats);
        }} />
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
