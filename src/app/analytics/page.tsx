"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  IndianRupee, TrendingUp, TrendingDown, Users, Activity,
  ChevronDown, ChevronRight, Receipt, UserPlus, Loader2,
  CalendarDays, ArrowUpRight, ArrowDownRight, Wallet,
  Search, Filter
} from "lucide-react";

// ── Types ──────────────────────────────────────────
interface ExpenseItem { id: number; name: string; category: string | null; amount: number; }
interface NewMember { id: number; name: string; phone: string; plan: string | null; amountPaid: number | null; status: string; }
interface PaymentItem { id: number; memberName: string; memberPhone: string; amount: number; type: string; }
interface AttendanceItem { id: number; name: string; phone: string; plan: string | null; time: string; method: string; }

interface DayData {
  date: string;
  expenses: ExpenseItem[];
  newMembers: NewMember[];
  payments: PaymentItem[];
  attendance: AttendanceItem[];
  totalExpense: number;
  totalIncome: number;
  attendanceCount: number;
  newMemberCount: number;
}

interface AnalyticsSummary {
  totalExpense: number;
  totalIncome: number;
  netRevenue: number;
  totalNewMembers: number;
  totalAttendance: number;
}

// ── Helpers ─────────────────────────────────────────
function fmtDate(d: string) {
  const date = new Date(d + "T00:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const formatted = date.toLocaleDateString("en-IN", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });

  if (isToday) return `Today — ${formatted}`;
  if (isYesterday) return `Yesterday — ${formatted}`;
  return formatted;
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function planBadge(plan: string | null) {
  if (!plan) return "—";
  const colors: Record<string, string> = {
    MONTHLY: "bg-blue-500/10 text-blue-500",
    QUARTERLY: "bg-purple-500/10 text-purple-500",
    ANNUAL: "bg-emerald-500/10 text-emerald-500",
  };
  const labels: Record<string, string> = { MONTHLY: "Monthly", QUARTERLY: "Quarterly", ANNUAL: "Annual" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${colors[plan] || "bg-gray-500/10 text-gray-500"}`}>
      {labels[plan] || plan}
    </span>
  );
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ── Summary Card ────────────────────────────────────
function SummaryCard({
  label, value, prefix, icon: Icon, color, bgColor, trend
}: {
  label: string; value: string; prefix?: string;
  icon: React.ComponentType<any>; color: string; bgColor: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div
      className="p-5 rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-400"}`}>
            {trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : trend === "down" ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
          </div>
        )}
      </div>
      <p className="text-2xl font-black mb-0.5" style={{ color: "var(--foreground)" }}>
        {prefix}{value}
      </p>
      <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{label}</p>
    </div>
  );
}

// ── Day Accordion ───────────────────────────────────
function DayCard({ day }: { day: DayData }) {
  const [open, setOpen] = useState(false);
  const hasActivity = day.expenses.length > 0 || day.newMembers.length > 0 || day.payments.length > 0 || day.attendance.length > 0;

  // Auto-open today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (day.date === today) setOpen(true);
  }, [day.date]);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:opacity-90"
        style={{ backgroundColor: hasActivity ? "var(--card)" : "var(--card)" }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: "var(--badge-bg)" }}>
            <CalendarDays className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{fmtDate(day.date)}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {day.newMemberCount > 0 && (
                <span className="text-[11px] font-semibold text-blue-500">{day.newMemberCount} new member{day.newMemberCount > 1 ? "s" : ""}</span>
              )}
              {day.attendanceCount > 0 && (
                <span className="text-[11px] font-semibold text-green-500">{day.attendanceCount} check-in{day.attendanceCount > 1 ? "s" : ""}</span>
              )}
              {day.expenses.length > 0 && (
                <span className="text-[11px] font-semibold text-red-500">{day.expenses.length} expense{day.expenses.length > 1 ? "s" : ""}</span>
              )}
              {!hasActivity && (
                <span className="text-[11px] font-semibold" style={{ color: "var(--foreground-muted)" }}>No activity</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Income / Expense badges */}
          {day.totalIncome > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-500">
              <ArrowUpRight className="w-3 h-3" /> ₹{day.totalIncome.toLocaleString()}
            </span>
          )}
          {day.totalExpense > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-500">
              <ArrowDownRight className="w-3 h-3" /> ₹{day.totalExpense.toLocaleString()}
            </span>
          )}
          {open ? <ChevronDown className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />}
        </div>
      </button>

      {/* Body */}
      {open && hasActivity && (
        <div className="px-6 pb-5 space-y-4 border-t" style={{ borderColor: "var(--card-border)" }}>

          {/* Payments / Income */}
          {day.payments.length > 0 && (
            <div className="pt-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-green-500">
                <IndianRupee className="w-3.5 h-3.5" /> Income ({day.payments.length})
              </h4>
              <div className="space-y-2">
                {day.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--badge-bg)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-xs">
                        {initials(p.memberName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{p.memberName}</p>
                        <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{p.memberPhone} · {p.type}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-green-500">+ ₹{p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          {day.expenses.length > 0 && (
            <div className="pt-2">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-red-500">
                <Receipt className="w-3.5 h-3.5" /> Expenses ({day.expenses.length})
              </h4>
              <div className="space-y-2">
                {day.expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--badge-bg)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{e.name}</p>
                      {e.category && <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{e.category}</p>}
                    </div>
                    <span className="text-sm font-black text-red-500">- ₹{e.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Members */}
          {day.newMembers.length > 0 && (
            <div className="pt-2">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-blue-500">
                <UserPlus className="w-3.5 h-3.5" /> New Members ({day.newMembers.length})
              </h4>
              <div className="space-y-2">
                {day.newMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--badge-bg)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">
                        {initials(m.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{m.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{m.phone}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      {planBadge(m.plan)}
                      {m.amountPaid != null && (
                        <span className="text-xs font-bold text-primary">₹{m.amountPaid.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance */}
          {day.attendance.length > 0 && (
            <div className="pt-2">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-emerald-500">
                <Activity className="w-3.5 h-3.5" /> Attendance ({day.attendance.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {day.attendance.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--badge-bg)" }}>
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-[10px]">
                      {initials(a.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{a.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>{fmtTime(a.time)} · {a.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────
export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayData[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  // Default: last 7 days
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);

  const [fromDate, setFromDate] = useState(weekAgo.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const data = await res.json();
        setDays(data.days || []);
        setSummary(data.summary || null);
      }
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Quick presets
  function setPreset(preset: "7d" | "30d" | "this-month" | "last-month") {
    const now = new Date();
    let f: Date, t: Date;
    switch (preset) {
      case "7d":
        f = new Date(now); f.setDate(now.getDate() - 6); t = now; break;
      case "30d":
        f = new Date(now); f.setDate(now.getDate() - 29); t = now; break;
      case "this-month":
        f = new Date(now.getFullYear(), now.getMonth(), 1); t = now; break;
      case "last-month":
        f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        t = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
    }
    setFromDate(f.toISOString().split("T")[0]);
    setToDate(t.toISOString().split("T")[0]);
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--background)" }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Analytics 📊</h1>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            Date-wise breakdown of gym activity — income, expenses, members &amp; attendance.
          </p>
        </header>

        {/* Date Filters */}
        <div
          className="p-5 rounded-2xl mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Date Range</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
              style={{
                backgroundColor: "var(--badge-bg)",
                color: "var(--foreground)",
                border: "1px solid var(--card-border)",
              }}
            />
            <span className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
              style={{
                backgroundColor: "var(--badge-bg)",
                color: "var(--foreground)",
                border: "1px solid var(--card-border)",
              }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(["7d", "30d", "this-month", "last-month"] as const).map((p) => {
              const labels: Record<string, string> = { "7d": "7 Days", "30d": "30 Days", "this-month": "This Month", "last-month": "Last Month" };
              return (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                  style={{
                    backgroundColor: "var(--badge-bg)",
                    color: "var(--foreground-muted)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3" style={{ color: "var(--foreground-muted)" }}>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-semibold">Loading analytics...</span>
          </div>
        )}

        {!loading && summary && (
          <>
            {/* Summary Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <SummaryCard
                label="Total Income"
                value={`${summary.totalIncome.toLocaleString()}`}
                prefix="₹"
                icon={TrendingUp}
                color="text-green-500"
                bgColor="bg-green-500/10"
                trend="up"
              />
              <SummaryCard
                label="Total Expenses"
                value={`${summary.totalExpense.toLocaleString()}`}
                prefix="₹"
                icon={TrendingDown}
                color="text-red-500"
                bgColor="bg-red-500/10"
                trend="down"
              />
              <SummaryCard
                label="Net Revenue"
                value={`${Math.abs(summary.netRevenue).toLocaleString()}`}
                prefix={summary.netRevenue >= 0 ? "₹" : "-₹"}
                icon={Wallet}
                color={summary.netRevenue >= 0 ? "text-primary" : "text-red-500"}
                bgColor={summary.netRevenue >= 0 ? "bg-primary/10" : "bg-red-500/10"}
                trend={summary.netRevenue >= 0 ? "up" : "down"}
              />
              <SummaryCard
                label="New Members"
                value={summary.totalNewMembers.toLocaleString()}
                icon={Users}
                color="text-blue-500"
                bgColor="bg-blue-500/10"
              />
              <SummaryCard
                label="Total Check-ins"
                value={summary.totalAttendance.toLocaleString()}
                icon={Activity}
                color="text-emerald-500"
                bgColor="bg-emerald-500/10"
              />
            </section>

            {/* Day-wise Timeline */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                Day-by-Day Breakdown
              </h2>
              {days.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <CalendarDays className="w-12 h-12 opacity-20" style={{ color: "var(--foreground-muted)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                    No data found for this date range
                  </p>
                </div>
              ) : (
                days.map((day) => <DayCard key={day.date} day={day} />)
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
