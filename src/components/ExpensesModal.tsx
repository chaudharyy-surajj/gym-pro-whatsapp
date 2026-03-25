"use client";
import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, IndianRupee, Calendar, Tag, AlertCircle } from "lucide-react";

interface Expense {
  id: number;
  name: string;
  amount: number;
  category: string | null;
  date: string;
}

export default function ExpensesModal({ onClose }: { onClose: () => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
  });

  async function fetchExpenses() {
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) setExpenses(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.amount) return;

    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", amount: "", category: "Other", date: new Date().toISOString().split("T")[0] });
        fetchExpenses();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add expense");
      }
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) fetchExpenses();
    } catch {
      alert("Failed to delete expense");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end" style={{ backgroundColor: "var(--overlay-bg)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div 
        className="relative h-full w-full md:w-[500px] flex flex-col shadow-2xl" 
        style={{ 
          backgroundColor: "var(--drawer-bg)", 
          borderLeft: "1px solid var(--drawer-border)", 
          animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" 
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--drawer-border)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10">
              <IndianRupee className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme">Manage Expenses</h2>
              <p className="text-xs text-theme-muted">Track gym costs and outgoings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-theme-muted hover:bg-black/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Add Expense Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl space-y-4" style={{ backgroundColor: "var(--badge-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-muted">Add New Expense</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Expense Name (e.g. Electricity Bill)"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <input
                type="number"
                placeholder="Amount (₹)"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
              <select
                className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Water">Water</option>
                <option value="Salary">Salary</option>
                <option value="Equipment">Equipment</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="date"
                className="col-span-2 w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
            <button
              type="submit"
              disabled={adding}
              className="w-full py-2 bg-primary text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Expense
            </button>
          </form>

          {/* List Expenses */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-muted">Expense History</h3>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-theme-muted" /></div>
            ) : expenses.length === 0 ? (
              <p className="text-center py-10 text-sm text-theme-muted italic">No expenses recorded yet</p>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <div key={exp.id} className="p-3 rounded-xl flex items-center justify-between group" style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-theme">{exp.name}</p>
                        <p className="text-[10px] text-theme-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(exp.date).toLocaleDateString()} · {exp.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-red-500">-₹{exp.amount.toLocaleString()}</span>
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-lg text-theme-muted hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
