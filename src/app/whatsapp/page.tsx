"use client";
import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  MessageSquare, Power, QrCode, MessageCircle, Send, ShieldCheck, 
  Zap, CheckCircle2, Loader2, Info, User, Search, Phone, 
  Clock, MoreVertical, Paperclip, Smile
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

type Chat = {
  id: number;
  phone: string;
  name: string | null;
  lastMessage: string | null;
  unreadCount: number;
  updatedAt: string;
};

type Message = {
  id: number;
  phone: string;
  text: string;
  direction: "INBOUND" | "OUTBOUND";
  createdAt: string;
};

export default function WhatsAppPage() {
  const [botData, setBotData] = useState<any>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch bot status and chats
  async function fetchData() {
    try {
      const [sRes, cRes] = await Promise.all([
        fetch("/api/whatsapp/status", { cache: "no-store" }),
        fetch("/api/whatsapp/chats", { cache: "no-store" })
      ]);
      if (sRes.ok) setBotData(await sRes.json());
      if (cRes.ok) setChats(await cRes.json());
    } finally {
      setLoading(false);
    }
  }

  // Fetch messages for selected chat
  async function fetchMessages(phone: string) {
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/messages?phone=${phone}`, { cache: "no-store" });
      if (res.ok) setMessages(await res.json());
    } finally {
      setMsgLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 5000);
    return () => clearInterval(inv);
  }, []);

  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone);
      const inv = setInterval(() => fetchMessages(selectedPhone), 3000);
      return () => clearInterval(inv);
    }
  }, [selectedPhone]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedPhone) return;
    const body = { phone: selectedPhone, text: inputText };
    
    // Optimistic UI update
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      phone: selectedPhone, 
      text: inputText, 
      direction: "OUTBOUND", 
      createdAt: new Date().toISOString() 
    }]);
    
    setInputText("");
    
    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {}
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--background)" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="px-8 py-5 border-b" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-black text-theme">WhatsApp Business</h1>
              {botData?.status === "CONNECTED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white font-bold text-[10px] uppercase rounded-full shadow-lg shadow-green-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white font-bold text-[10px] uppercase rounded-full shadow-lg shadow-red-500/20">
                   {botData?.status || "OFFLINE"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
               <div className="text-right mr-4 hidden md:block">
                  <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Auto Replies</p>
                  <p className="text-xs font-black text-primary">{botData?.stats?.autoReplies ?? 0} Handled</p>
               </div>
               <button className="p-2 rounded-xl text-theme-muted hover:bg-black/5" style={{ border: "1px solid var(--card-border)" }}>
                  <MoreVertical className="w-5 h-5" />
               </button>
            </div>
          </div>
        </header>

        {/* QR Code Banner - Shows when bot is disconnected */}
        {botData?.status !== "CONNECTED" && botData?.qr && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b-2 border-yellow-400 p-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg shadow-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(botData.qr)}`} 
                    alt="WhatsApp QR Code"
                    className="w-20 h-20"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100 mb-1">
                    🔌 WhatsApp Bot Not Connected
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Scan this QR code with your WhatsApp to connect the bot
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded-lg p-3 text-xs text-yellow-900 dark:text-yellow-100">
                  <p className="font-bold mb-1">📱 How to scan:</p>
                  <p>1. Open WhatsApp on your phone</p>
                  <p>2. Go to Settings → Linked Devices</p>
                  <p>3. Tap "Link a Device"</p>
                  <p>4. Scan this QR code</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          
          {/* Chat List Sider */}
          <div className="w-80 md:w-96 flex flex-col border-r shadow-sm" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--drawer-bg)" }}>
             <div className="p-4 border-b" style={{ borderColor: "var(--card-border)" }}>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search chats..."
                    className="w-full bg-theme-muted/5 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none border border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar">
                {chats.length > 0 ? chats.map((chat) => (
                  <button 
                    key={chat.id}
                    onClick={() => setSelectedPhone(chat.phone)}
                    className={`w-full flex items-center gap-4 p-4 transition-all border-b border-transparent hover:bg-theme-muted/5 ${selectedPhone === chat.phone ? "bg-primary/5 border-l-4 border-l-primary" : ""}`}
                    style={selectedPhone === chat.phone ? { borderBottomColor: "var(--card-border)" } : {}}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0 border border-primary/20">
                      {chat.name?.[0] || chat.phone[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-bold text-theme truncate">{chat.name || chat.phone}</p>
                        <span className="text-[10px] text-theme-muted flex-shrink-0">
                          {format(new Date(chat.updatedAt), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-theme-muted truncate">
                        {chat.lastMessage || "No messages yet"}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-primary/30">
                        {chat.unreadCount}
                      </span>
                    )}
                  </button>
                )) : (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 opacity-20">
                    <MessageSquare className="w-12 h-12" />
                    <p className="text-sm font-bold uppercase tracking-widest text-center px-10 leading-tight">Bot is syncing your recent WhatsApp chats...</p>
                  </div>
                )}
             </div>

             {/* Bottom Automation Controls */}
             <div className="p-6 border-t" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card)" }}>
                <h3 className="text-xs font-black text-theme-muted uppercase tracking-widest mb-4">Automations</h3>
                <div className="space-y-3">
                   {[
                     { key: 'birthdayEnabled', label: 'Birthday Wishes', icon: Zap },
                     { key: 'feeReminderEnabled', label: 'Fee Reminders', icon: ShieldCheck },
                     { key: 'absenceEnabled', label: 'Absence Nudges', icon: Clock },
                   ].map((item) => (
                     <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <item.icon className="w-3.5 h-3.5 text-primary" />
                           <span className="text-xs font-bold text-theme">{item.label}</span>
                        </div>
                        <button 
                          onClick={async () => {
                            const current = !!botData?.config?.[item.key];
                            await fetch('/api/settings', {
                              method: 'PUT',
                              body: JSON.stringify({ [item.key]: !current })
                            });
                            fetchData();
                          }}
                          className={`w-9 h-5 rounded-full relative px-1 flex items-center transition-all ${botData?.config?.[item.key] ? 'bg-primary justify-end' : 'bg-zinc-600 justify-start'}`}
                        >
                           <div className="w-3 h-3 bg-white rounded-full shadow-md" />
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Main Chat Window */}
          <div className="flex-1 flex flex-col relative overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
            
            {selectedPhone ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between shadow-sm z-10" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card)" }}>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20">
                        {selectedPhone[0]}
                      </div>
                      <div>
                        <p className="font-bold text-theme">{chats.find(c => c.phone === selectedPhone)?.name || selectedPhone}</p>
                        <p className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Session
                        </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                       <button className="p-2.5 rounded-xl hover:bg-theme-muted/5 text-theme-muted"><Phone className="w-4 h-4" /></button>
                       <button className="p-2.5 rounded-xl hover:bg-theme-muted/5 text-theme-muted"><Info className="w-4 h-4" /></button>
                   </div>
                </div>

                {/* Messages Container */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar"
                  style={{ backgroundImage: "linear-gradient(var(--background), var(--background))" }}
                >
                  {messages.map((m, i) => {
                    const isOut = m.direction === "OUTBOUND";
                    return (
                      <div key={m.id} className={`flex flex-col ${isOut ? "items-end" : "items-start"}`}>
                        <div 
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isOut ? "bg-primary text-white rounded-tr-none" : "bg-card text-theme rounded-tl-none border border-card-border"}`}
                        >
                          <p className="leading-relaxed">{m.text}</p>
                        </div>
                        <span className="text-[10px] text-theme-muted mt-1 px-1">
                          {format(new Date(m.createdAt), 'h:mm a')}
                        </span>
                      </div>
                    );
                  })}
                  {msgLoading && messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs font-bold uppercase tracking-widest text-theme-muted">Loading history...</p>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t z-10" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card)" }}>
                  <div className="flex items-end gap-3 max-w-4xl mx-auto">
                    <button className="p-3 rounded-xl hover:bg-theme-muted/5 text-theme-muted"><Smile className="w-5 h-5" /></button>
                    <button className="p-3 rounded-xl hover:bg-theme-muted/5 text-theme-muted"><Paperclip className="w-5 h-5" /></button>
                    <div className="flex-1 relative">
                       <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type a message..."
                        rows={1}
                        className="w-full bg-theme-muted/5 border border-card-border rounded-xl py-3 px-4 text-sm outline-none resize-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all max-h-32"
                       />
                    </div>
                    <button 
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
                /* Empty Chat Placeholder */
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center select-none">
                   <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 border border-primary/10">
                      <MessageSquare className="w-12 h-12 text-primary opacity-30" />
                   </div>
                   <h2 className="text-xl font-black text-theme mb-2">Select a Contact</h2>
                   <p className="text-sm text-theme-muted max-w-sm">Click on a chat thread to start messaging your members directly from the dashboard.</p>
                   
                   {/* Bot Setup Helper if Disconnected */}
                   {botData?.status !== "CONNECTED" && botData?.qr && (
                     <div className="mt-10 p-6 rounded-2xl max-w-sm flex flex-col items-center gap-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
                        <div className="bg-white p-2 rounded-xl shadow-xl">
                           <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(botData.qr)}`} 
                              alt="WhatsApp QR Code"
                              className="w-40 h-40"
                           />
                        </div>
                        <p className="text-xs font-bold text-theme leading-tight">Scan this QR with your WhatsApp Business app to link the bot.</p>
                     </div>
                   )}
                </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--card-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); }
      `}</style>
    </div>
  );
}
