"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Loader2, Save, IndianRupee, Settings, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    monthlyPrice: 999,
    quarterlyPrice: 2699,
    annualPrice: 9999,
  });
  const [customPlans, setCustomPlans] = useState<Array<{ id: string; label: string; months: number; price: number }>>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            monthlyPrice: data.monthlyPrice ?? 999,
            quarterlyPrice: data.quarterlyPrice ?? 2699,
            annualPrice: data.annualPrice ?? 9999,
          });
          try {
            setCustomPlans(JSON.parse(data.customPlans || "[]"));
          } catch (e) {
            setCustomPlans([]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyPrice: Number(form.monthlyPrice),
          quarterlyPrice: Number(form.quarterlyPrice),
          annualPrice: Number(form.annualPrice),
          customPlans,
        })
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Settings saved successfully!");
    } catch (e) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function addCustomPlan() {
    setCustomPlans([...customPlans, { id: `CUSTOM_${Date.now()}`, label: "New Plan", months: 1, price: 1000 }]);
  }

  function updateCustomPlan(id: string, field: keyof typeof customPlans[0], value: string | number) {
    setCustomPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg)", color: "var(--foreground)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Configure global prices and bot settings</p>
            </div>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pricing Card */}
              <div className="p-6 md:p-8 rounded-2xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-primary" />
                  Membership Plan Prices
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--foreground-muted)" }}>Monthly Price</label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                      <input
                        type="number"
                        name="monthlyPrice"
                        value={form.monthlyPrice}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/40 font-medium"
                        style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--foreground-muted)" }}>Quarterly Price</label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                      <input
                        type="number"
                        name="quarterlyPrice"
                        value={form.quarterlyPrice}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/40 font-medium"
                        style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--foreground-muted)" }}>Annual Price</label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                      <input
                        type="number"
                        name="annualPrice"
                        value={form.annualPrice}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/40 font-medium"
                        style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--card-border)", color: "var(--foreground)" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6 pt-4 border-t" style={{ borderColor: "var(--card-border)" }}>
                  {customPlans.map((plan) => (
                    <div key={plan.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-black/5 p-4 rounded-xl border" style={{ borderColor: "var(--card-border)" }}>
                      <div className="md:col-span-4">
                        <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Plan Name</label>
                        <input
                          type="text"
                          value={plan.label}
                          onChange={(e) => updateCustomPlan(plan.id, "label", e.target.value)}
                          className="w-full px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                          style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Duration (Months)</label>
                        <input
                          type="number"
                          value={plan.months}
                          onChange={(e) => updateCustomPlan(plan.id, "months", Number(e.target.value))}
                          className="w-full px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                          style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--foreground-muted)" }}>Price (₹)</label>
                        <input
                          type="number"
                          value={plan.price}
                          onChange={(e) => updateCustomPlan(plan.id, "price", Number(e.target.value))}
                          className="w-full px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                          style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          onClick={() => setCustomPlans(customPlans.filter(p => p.id !== plan.id))}
                          className="p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Remove Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {customPlans.length === 0 && (
                    <p className="text-sm text-theme-muted italic">No custom plans configured.</p>
                  )}
                </div>
                <button
                  onClick={addCustomPlan}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Custom Plan
                </button>

                <div className="mt-8 flex justify-end border-t pt-6" style={{ borderColor: "var(--card-border)" }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-primary text-white transition-all hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 hover:scale-[1.02]"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
