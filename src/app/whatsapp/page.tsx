"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { MessageSquare, Power, QrCode, MessageCircle, Send, ShieldCheck, Zap, CheckCircle2, Loader2, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function WhatsAppPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const inv = setInterval(fetchStatus, 5000);
    return () => clearInterval(inv);
  }, []);

  const botStats = [
    { label: "Messages Sent",  value: data?.stats?.messagesSent ?? "0", icon: MessageCircle, color: "text-blue-500",   trend: "Total Sent" },
    { label: "Auto Replies",   value: data?.stats?.autoReplies ?? "0",   icon: ShieldCheck,   color: "text-green-500",  trend: "Live Resp" },
    { label: "Triggers Run",   value: data?.stats?.triggersRun ?? "0",    icon: Zap,           color: "text-orange-500", trend: "Automated" },
  ];

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--background)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-theme">WhatsApp Business Central</h1>
                {data?.status === "CONNECTED" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white font-bold text-[10px] uppercase rounded-full shadow-lg shadow-green-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Online
                    </span>
                 )}
            </div>
            <p className="text-theme-muted text-sm">Manage your bot connection and automated communication.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 text-red-500 font-bold border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all text-sm"
              style={{ backgroundColor: "var(--card)" }}>
              <Power className="w-4 h-4" />
              Disconnect Bot
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-sm">
              <Send className="w-4 h-4" />
              Broadcast Message
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {botStats.map((stat) => (
            <div
              key={stat.label}
              className="p-6 rounded-2xl group transition-all duration-300"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color}`} style={{ backgroundColor: "var(--badge-bg)" }}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-lg text-theme-muted" style={{ backgroundColor: "var(--badge-bg)" }}>
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-3xl font-black text-theme mb-1">{stat.value}</h3>
              <p className="text-theme-muted text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR + Triggers */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            {/* QR Panel */}
            <div
              className="rounded-2xl p-7 flex flex-col items-center justify-center text-center"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
            >
              {data?.status === "CONNECTED" ? (
                  <div className="w-40 h-40 bg-green-500/10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-green-500/30 mb-5">
                      <div className="p-4 bg-green-500 rounded-full shadow-lg shadow-green-500/20 mb-3">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-green-500 font-bold text-xs uppercase">Connected</p>
                  </div>
              ) : data?.qr ? (
                  <div className="w-48 h-48 bg-white p-2 rounded-xl mb-5 shadow-2xl relative">
                     <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.qr)}`} 
                        alt="WhatsApp QR Code"
                        className="w-full h-full"
                     />
                  </div>
              ) : (
                  <div className="w-40 h-40 bg-zinc-500/5 flex flex-col items-center justify-center rounded-2xl mb-5 border-2 border-dashed border-zinc-500/20">
                      <Loader2 className="w-8 h-8 text-theme-muted animate-spin mb-3" />
                      <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest">Initializing Bot</p>
                  </div>
              )}
              
              <h2 className="text-lg font-bold text-theme mb-2">
                {data?.status === "CONNECTED" ? "Linked Successfully" : "Link WhatsApp"}
              </h2>
              <p className="text-theme-muted text-xs mb-5 leading-relaxed">
                {data?.status === "CONNECTED" 
                  ? "Your bot is now actively monitoring your business WhatsApp account." 
                  : "Scan to connect your Business WhatsApp account. The bot will start responding once linked."}
              </p>
              
              {!data?.qr && data?.status !== "CONNECTED" && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-xl mb-4 self-stretch">
                   <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                   <p className="text-left text-[10px] text-blue-500 opacity-80 leading-tight">Bot is starting puppeteer... This may take up to 30 seconds.</p>
                </div>
              )}

              <button
                onClick={fetchStatus}
                className="w-full py-2.5 rounded-xl text-theme-muted text-sm font-semibold hover:text-theme transition-all"
                style={{ backgroundColor: "var(--badge-bg)", border: "1px solid var(--card-border)" }}
              >
                Refresh Status
              </button>
            </div>

            {/* Bot Triggers (Placeholders for now, linked to DB soon) */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
            >
              <h2 className="text-base font-bold text-theme mb-4">Bot Triggers</h2>
              <div className="space-y-3">
                {[
                  { label: "Birthday Wishes", on: true },
                  { label: "Fee Reminders",   on: true },
                  { label: "Absence Nudges",  on: false },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: "var(--badge-bg)" }}
                  >
                    <span className="text-sm font-medium text-theme">{t.label}</span>
                    <div className={`w-10 h-6 ${t.on ? "bg-primary" : "bg-zinc-600"} rounded-full relative px-1 flex items-center ${t.on ? "justify-end" : "justify-start"} cursor-pointer transition-all`}>
                      <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Logs */}
          <div
            className="lg:col-span-2 rounded-2xl p-7"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <h2 className="text-lg font-bold text-theme mb-6">Recent Automated Logs</h2>
            <div className="space-y-4">
              {data?.logs?.length > 0 ? data.logs.map((log: any, i: number) => (
                <div
                  key={log.id}
                  className="rounded-xl p-5 flex items-start gap-4 transition-all"
                  style={{ backgroundColor: "var(--badge-bg)", border: "1px solid var(--card-border)" }}
                >
                  <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-theme">{log.phone}</span>
                      <span className="text-[10px] text-theme-muted flex-shrink-0 ml-2">
                         {formatDistanceToNow(new Date(log.createdAt))} ago
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">{log.type}</p>
                    <p className="text-sm text-theme-muted mb-3 italic">"{log.text}"</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-[10px] font-bold text-green-500 uppercase">
                          {log.direction === "INBOUND" ? "Auto-Replied" : "Broadcasted"}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-20 flex flex-col items-center justify-center gap-3 opacity-30">
                    <MessageSquare className="w-10 h-10" />
                    <p className="text-sm font-bold">No recent messages caught by bot</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
