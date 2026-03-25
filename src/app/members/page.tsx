"use client";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search, UserPlus, Filter, Edit2, Trash2,
  CheckCircle2, Clock, X, Upload, User,
  Phone, Mail, MapPin, AlertTriangle, Calendar,
  CreditCard, Shield, FileText, ChevronDown,
  Loader2, AlertCircle, Users, Snowflake, Zap, Lock, Unlock
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────
interface Member {
  id: number;
  firstName: string | null;
  lastName: string | null;
  name: string;
  gender: string | null;
  photo: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  plan: string | null;
  status: string;
  joinDate: string | null;
  membershipEnd: string | null;
  feeDueDate: string | null;
  amountPaid: string | null;
  birthday: string | null;
  notes: string | null;
  cardNumber: string | null;
}

type FormData = Omit<Member, "id" | "name"> & { id?: number; customDuration?: string };

const EMPTY_FORM: FormData = {
  firstName: "", lastName: "", gender: "", photo: null,
  phone: "", email: "", address: "",
  emergencyContact: "", emergencyPhone: "",
  plan: "", status: "ACTIVE",
  joinDate: "", membershipEnd: "", feeDueDate: "",
  amountPaid: "",
  birthday: "", notes: "",
  cardNumber: "",
};

const defaultPlans = [
  { value: "MONTHLY",   label: "Monthly — ₹999",     months: 1,  price: 999  },
  { value: "QUARTERLY", label: "Quarterly — ₹2,699", months: 3,  price: 2699 },
  { value: "ANNUAL",    label: "Annual — ₹9,999",    months: 12, price: 9999 },
  { value: "CUSTOM",    label: "Custom Plan",        months: 0,  price: 0    },
];
const STATUSES = ["ACTIVE", "DUE", "INACTIVE", "FROZEN"];

// Auto-compute membership end date from join date + plan
function computeEndDate(joinDate: string, plan: string, plansConfig: any[]): string {
  if (plan === "CUSTOM") return "";
  const planConfig = plansConfig.find((p) => p.value === plan);
  if (!joinDate || !planConfig || planConfig.months === 0) return "";
  const d = new Date(joinDate);
  d.setMonth(d.getMonth() + planConfig.months);
  d.setDate(d.getDate() - 1); // inclusive last day
  return d.toISOString().split("T")[0];
}

// ── Helpers ────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function statusStyle(s: string) {
  if (s === "ACTIVE")  return "bg-green-500/10 text-green-500";
  if (s === "DUE")     return "bg-orange-500/10 text-orange-500";
  if (s === "FROZEN")  return "bg-blue-500/10 text-blue-400";
  return "bg-red-500/10 text-red-500";
}
function planLabel(p: string | null, plansConfig: any[] = defaultPlans) {
  if (p === "CUSTOM") return "Other (Manual)";
  const found = plansConfig.find(x => x.value === p);
  return found ? found.label.split("—")[0].trim() : (p ?? "—");
}
function avatar(m: Member) {
  if (m.photo) return <img src={m.photo} alt="" className="w-full h-full object-cover" />;
  const initials = [m.firstName?.[0], m.lastName?.[0]].filter(Boolean).join("") || m.name[0] || "?";
  return <span className="text-primary font-bold text-sm">{initials.toUpperCase()}</span>;
}

// ── Section Header ─────────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: "var(--card-border)" }}>
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-widest text-theme-muted">{label}</span>
    </div>
  );
}

// ── Input / Select Wrappers ────────────────────────────────────────────
function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-theme-muted mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", disabled,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className="w-full rounded-xl px-3.5 py-2.5 text-sm text-theme outline-none transition-all focus:ring-2 focus:ring-primary/30"
      style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}
    />
  );
}

function Select({
  value, onChange, children,
}: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl px-3.5 py-2.5 text-sm text-theme outline-none transition-all focus:ring-2 focus:ring-primary/30 pr-9"
        style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
    </div>
  );
}

// ── Member Form Panel ──────────────────────────────────────────────────
function MemberFormPanel({
  initial, plans, onClose, onSaved,
}: {
  initial: FormData | null;
  plans: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial?.id;
  
  const initialForm = { ...(initial ?? EMPTY_FORM) };
  if (initialForm.plan && initialForm.plan !== "CUSTOM") {
    // If the plan is not in the plans array, it's an ad-hoc custom plan
    const isKnown = plans.some(p => p.value === initialForm.plan);
    if (!isKnown) {
      if (initialForm.plan.startsWith("Other — ")) {
        const match = initialForm.plan.match(/\d+/);
        if (match) initialForm.customDuration = match[0];
      }
      initialForm.plan = "CUSTOM";
    }
  }
  
  const [form, setForm] = useState<FormData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(field: keyof FormData, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("photo", reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!form.phone.trim()) { setError("Phone number is required."); return; }
    if (!form.cardNumber?.trim()) { setError("Card number is required for biometric mapping."); return; }
    
    const submissionData = { ...form };
    if (submissionData.plan === "CUSTOM") {
      if (!submissionData.customDuration?.trim()) {
        setError("Please enter a duration (number of months).");
        return;
      }
      if (!submissionData.amountPaid?.trim()) {
        setError("Please enter an amount for the custom plan.");
        return;
      }
      submissionData.plan = `Other — ${submissionData.customDuration.trim()} Months`;
    }
    delete submissionData.customDuration;

    setSaving(true); setError(null);
    try {
      const url = isEdit ? `/api/members/${initial!.id}` : "/api/members";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
      } else {
        onSaved();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "var(--overlay-bg)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-2xl z-50 flex flex-col shadow-2xl"
        style={{
          backgroundColor: "var(--drawer-bg)",
          borderLeft: "1px solid var(--drawer-border)",
          animation: "slideIn 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0"
          style={{ borderColor: "var(--drawer-border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme">{isEdit ? "Edit Member" : "Add New Member"}</h2>
              <p className="text-xs text-theme-muted">{isEdit ? "Update member details" : "Fill in the member information below"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-theme-muted hover:text-theme transition-colors"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-8">
          {error && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Profile ────────────────────────────── */}
          <div>
            <SectionHeader icon={<User className="w-4 h-4" />} label="Profile" />

            {/* Photo upload */}
            <div className="flex items-center gap-5 mb-5">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center flex-shrink-0 cursor-pointer transition-all hover:border-primary/50"
                style={{ borderColor: "var(--input-border)", backgroundColor: "var(--input-bg)" }}
                onClick={() => fileRef.current?.click()}
              >
                {form.photo
                  ? <img src={form.photo} alt="" className="w-full h-full object-cover" />
                  : <Upload className="w-6 h-6 text-theme-muted" />}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/10 transition-all"
                >
                  {form.photo ? "Change Photo" : "Upload Photo"}
                </button>
                {form.photo && (
                  <button
                    type="button"
                    onClick={() => set("photo", null)}
                    className="ml-2 px-3 py-2 rounded-xl text-sm text-theme-muted hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-theme-muted mt-1.5">JPG, PNG or WebP up to 5MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name">
                <Input value={form.firstName ?? ""} onChange={(v) => set("firstName", v)} placeholder="e.g. Raj" />
              </Field>
              <Field label="Last Name">
                <Input value={form.lastName ?? ""} onChange={(v) => set("lastName", v)} placeholder="e.g. Malhotra" />
              </Field>
              <Field label="Gender">
                <Select value={form.gender ?? ""} onChange={(v) => set("gender", v)}>
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Prefer not to say</option>
                </Select>
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.birthday ?? ""} onChange={(v) => set("birthday", v)} />
              </Field>
            </div>
          </div>

          {/* ── Contact ────────────────────────────── */}
          <div>
            <SectionHeader icon={<Phone className="w-4 h-4" />} label="Contact Information" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone Number" required>
                <Input value={form.phone} onChange={(v) => set("phone", v)} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Card Number (Biometric)" required>
                <Input value={form.cardNumber ?? ""} onChange={(v) => set("cardNumber", v)} placeholder="e.g. 1001" />
              </Field>
              <Field label="Email Address">
                <Input type="email" value={form.email ?? ""} onChange={(v) => set("email", v)} placeholder="raj@example.com" />
              </Field>
              <div className="col-span-2">
                <Field label="Home Address">
                  <Input value={form.address ?? ""} onChange={(v) => set("address", v)} placeholder="123, Street, City, State - PIN" />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Membership ─────────────────────────── */}
          <div>
            <SectionHeader icon={<CreditCard className="w-4 h-4" />} label="Membership Details" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Membership Plan">
                <Select value={form.plan ?? ""} onChange={(v) => {
                  const selectedPlan = plans.find(p => p.value === v);
                  const priceToSet = selectedPlan && selectedPlan.price > 0 ? String(selectedPlan.price) : form.amountPaid ?? "";
                  
                  if (v === "CUSTOM") {
                    setForm((prev) => ({ ...prev, plan: v, amountPaid: priceToSet }));
                  } else {
                    const endDate = computeEndDate(form.joinDate ?? "", v, plans);
                    setForm((prev) => ({ ...prev, plan: v, membershipEnd: endDate, feeDueDate: endDate, amountPaid: priceToSet }));
                  }
                }}>
                  <option value="">Select plan</option>
                  {plans.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </Field>
              {form.plan === "CUSTOM" && (
                <>
                  <Field label="Duration (Months)" required>
                    <Input 
                      type="number"
                      value={form.customDuration ?? ""} 
                      onChange={(v) => {
                        setForm(prev => {
                          const next = { ...prev, customDuration: v };
                          const md = parseInt(v) || 0;
                          if (md > 0 && next.joinDate) {
                            const d = new Date(next.joinDate);
                            d.setMonth(d.getMonth() + md);
                            d.setDate(d.getDate() - 1);
                            const ed = d.toISOString().split("T")[0];
                            next.membershipEnd = ed;
                            next.feeDueDate = ed;
                          } else {
                            next.membershipEnd = "";
                            next.feeDueDate = "";
                          }
                          return next;
                        });
                      }} 
                      placeholder="e.g. 6" 
                    />
                  </Field>
                  <Field label="Custom Plan Amount (₹)" required>
                    <Input
                      type="number"
                      value={form.amountPaid ?? ""}
                      onChange={(v) => set("amountPaid", v)}
                      placeholder="e.g. 1500"
                    />
                  </Field>
                </>
              )}
              <Field label="Join Date">
                <Input type="date" value={form.joinDate ?? ""} onChange={(v) => {
                  if (form.plan === "CUSTOM") {
                    setForm((prev) => {
                      const next = { ...prev, joinDate: v };
                      const md = parseInt(next.customDuration ?? "0") || 0;
                      if (md > 0 && v) {
                        const d = new Date(v);
                        d.setMonth(d.getMonth() + md);
                        d.setDate(d.getDate() - 1);
                        const ed = d.toISOString().split("T")[0];
                        next.membershipEnd = ed;
                        next.feeDueDate = ed;
                      }
                      return next;
                    });
                  } else {
                    const endDate = computeEndDate(v, form.plan ?? "", plans);
                    setForm((prev) => ({ ...prev, joinDate: v, membershipEnd: endDate, feeDueDate: endDate }));
                  }
                }} />
              </Field>
              <Field label="Membership End Date">
                <div className="relative">
                  <Input type="date" value={form.membershipEnd ?? ""} onChange={(v) => set("membershipEnd", v)} />
                  {form.membershipEnd && form.plan !== "CUSTOM" && form.plan !== "" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary pointer-events-none">Auto</span>
                  )}
                </div>
              </Field>
              <Field label="Fee Due Date">
                <Input type="date" value={form.feeDueDate ?? ""} onChange={(v) => set("feeDueDate", v)} />
              </Field>
              <div className="flex items-center self-end pb-3 pt-3 text-xs text-theme-muted col-span-2">
                Status is auto-computed based on dates and actions.
              </div>
            </div>
          </div>

          {/* ── Emergency ──────────────────────────── */}
          <div>
            <SectionHeader icon={<Shield className="w-4 h-4" />} label="Emergency Contact" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name">
                <Input value={form.emergencyContact ?? ""} onChange={(v) => set("emergencyContact", v)} placeholder="e.g. Sunita Malhotra" />
              </Field>
              <Field label="Contact Phone">
                <Input value={form.emergencyPhone ?? ""} onChange={(v) => set("emergencyPhone", v)} placeholder="+91 98765 43210" />
              </Field>
            </div>
          </div>

          {/* ── Notes ──────────────────────────────── */}
          <div>
            <SectionHeader icon={<FileText className="w-4 h-4" />} label="Additional Notes" />
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any special requirements, health conditions, preferences..."
              rows={3}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-theme outline-none transition-all focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-7 py-5 border-t flex items-center justify-between gap-4 flex-shrink-0"
          style={{ borderColor: "var(--drawer-border)", backgroundColor: "var(--background-secondary)" }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-theme-muted hover:text-theme transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:pointer-events-none text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Member"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Member Detail Panel ────────────────────────────────────────────────
function MemberDetailPanel({
  member, plans, onClose, onEdit
}: {
  member: Member; plans: any[]; onClose: () => void; onEdit: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-end" style={{ backgroundColor: "var(--overlay-bg)" }}>
        <div className="absolute inset-0 transition-opacity" onClick={onClose} />
        <div 
          className="relative h-full w-full md:w-[600px] flex flex-col shadow-2xl" 
          style={{ backgroundColor: "var(--drawer-bg)", borderLeft: "1px solid var(--drawer-border)", animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--drawer-border)", backgroundColor: "var(--card)" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 text-xl" style={{ backgroundColor: "var(--primary)", opacity: 0.1 }}></div>
              <div className="absolute w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 text-xl border border-primary/20">
                {avatar(member)}
              </div>
              <div className="ml-16">
                <h2 className="text-xl font-bold text-theme">{member.name}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full text-xs font-bold ${statusStyle(member.status)}`}>
                  {member.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-theme-muted hover:bg-black/5 transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-theme-muted mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Phone</p>
                <p className="font-semibold text-sm text-theme">{member.phone}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-theme-muted mb-1 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5"/> Card Number</p>
                <p className="font-semibold text-sm text-primary">{member.cardNumber || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-theme-muted mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> Email</p>
                <p className="font-semibold text-sm text-theme">{member.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-theme-muted mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Gender</p>
                <p className="font-semibold text-sm text-theme">{member.gender || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-theme-muted mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Date of Birth</p>
                <p className="font-semibold text-sm text-theme">{fmtDate(member.birthday)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold text-theme-muted mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Address</p>
                <p className="font-semibold text-sm text-theme">{member.address || "—"}</p>
              </div>
            </div>

            <div>
              <SectionHeader icon={<CreditCard className="w-4 h-4" />} label="Membership" />
              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl" style={{ backgroundColor: "var(--badge-bg)" }}>
                <div>
                  <p className="text-xs font-bold text-theme-muted mb-1">Plan</p>
                  <p className="font-bold" style={{ color: "var(--primary)" }}>{planLabel(member.plan, plans)}</p>
                </div>
                {(!member.plan || String(member.plan).startsWith("Other")) && (
                  <div>
                    <p className="text-xs font-bold text-theme-muted mb-1">Amount Paid</p>
                    <p className="font-bold" style={{ color: "var(--primary)" }}>₹{member.amountPaid || "0"}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-theme-muted mb-1">Join Date</p>
                  <p className="font-semibold text-sm text-theme">{fmtDate(member.joinDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-muted mb-1">End Date</p>
                  <p className="font-semibold text-sm text-theme">{fmtDate(member.membershipEnd)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-theme-muted mb-1">Fee Due Date</p>
                  <p className="font-semibold text-sm text-red-500">{fmtDate(member.feeDueDate)}</p>
                </div>
              </div>
            </div>

            <div>
              <SectionHeader icon={<Shield className="w-4 h-4" />} label="Emergency Contact" />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-theme-muted mb-1">Contact Name</p>
                  <p className="font-semibold text-sm text-theme">{member.emergencyContact || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-muted mb-1">Contact Phone</p>
                  <p className="font-semibold text-sm text-theme">{member.emergencyPhone || "—"}</p>
                </div>
              </div>
            </div>

            {member.notes && (
              <div>
                <SectionHeader icon={<FileText className="w-4 h-4" />} label="Additional Notes" />
                <p className="text-sm rounded-xl p-4 whitespace-pre-wrap text-theme" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}>{member.notes}</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: "var(--drawer-border)", backgroundColor: "var(--background-secondary)" }}>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-theme-muted hover:text-theme transition-all" style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}>Close</button>
            <button onClick={() => { onClose(); onEdit(); }} className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
              <Edit2 className="w-4 h-4" /> Edit Member
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Delete Confirm Modal ─────────────────────────────────────────────
function DeleteConfirm({
  name, onCancel, onConfirm, loading,
}: { name: string; onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: "var(--overlay-bg)" }}>
      <div
        className="w-full max-w-sm p-6 rounded-2xl shadow-2xl relative"
        style={{ backgroundColor: "var(--drawer-bg)", border: "1px solid var(--drawer-border)", animation: "slideIn 0.2s ease-out" }}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-theme">Remove Member?</p>
            <p className="text-sm text-theme-muted mt-1 leading-relaxed">This will permanently delete <strong style={{ color: "var(--foreground)" }}>{name}</strong> and all their data. This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-theme-muted hover:text-theme transition-all"
            style={{ backgroundColor: "var(--badge-bg)", border: "1px solid var(--card-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete Member
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState(defaultPlans);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FormData | null>(null);
  const [viewTarget, setViewTarget] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/members", { cache: "no-store" });
      if (res.ok) setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
    fetch("/api/settings", { cache: "no-store" }).then(r => r.json()).then(data => {
      if (data && !data.error) {
        let customArr: any[] = [];
        try { customArr = JSON.parse(data.customPlans || "[]"); } catch (e) {}
        
        const dynamicCustomPlans = customArr.map((cp: any) => ({
          value: cp.id,
          label: `${cp.label} — ₹${cp.price}`,
          months: cp.months,
          price: cp.price
        }));

        setPlans([
          { value: "MONTHLY",   label: `Monthly — ₹${data.monthlyPrice ?? 999}`,    months: 1,  price: data.monthlyPrice ?? 999 },
          { value: "QUARTERLY", label: `Quarterly — ₹${data.quarterlyPrice ?? 2699}`, months: 3,  price: data.quarterlyPrice ?? 2699 },
          { value: "ANNUAL",    label: `Annual — ₹${data.annualPrice ?? 9999}`,       months: 12, price: data.annualPrice ?? 9999 },
          ...dynamicCustomPlans,
          { value: "CUSTOM",    label: "Other (Manual)",                           months: 0,  price: 0 },
        ]);
      }
    });
  }, []);

  function openAdd() { setEditTarget(null); setFormOpen(true); }
  function openEdit(m: Member) {
    setEditTarget({
      id: m.id,
      firstName: m.firstName ?? "",
      lastName: m.lastName ?? "",
      gender: m.gender ?? "",
      photo: m.photo ?? null,
      phone: m.phone,
      email: m.email ?? "",
      address: m.address ?? "",
      emergencyContact: m.emergencyContact ?? "",
      emergencyPhone: m.emergencyPhone ?? "",
      plan: m.plan ?? "",
      status: m.status,
      joinDate: m.joinDate ? m.joinDate.split("T")[0] : "",
      membershipEnd: m.membershipEnd ? m.membershipEnd.split("T")[0] : "",
      feeDueDate: m.feeDueDate ? m.feeDueDate.split("T")[0] : "",
      amountPaid: m.amountPaid != null ? String(m.amountPaid) : "",
      birthday: m.birthday ? m.birthday.split("T")[0] : "",
      notes: m.notes ?? "",
      cardNumber: m.cardNumber ?? "",
    });
    setFormOpen(true);
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await fetch(`/api/members/${id}`, { method: "DELETE" });
      setDeleteId(null);
      fetchMembers();
    } finally {
      setDeleting(false);
    }
  }

  async function performAction(id: number, action: "freeze" | "unfreeze" | "activate") {
    setActionLoading(id);
    try {
      await fetch(`/api/members/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchMembers();
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.plan ?? "").toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "ALL" || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--background)" }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-theme mb-1">Member Directory</h1>
            <p className="text-theme-muted text-sm">
              Manage all Gravity Fitness members · <span className="text-primary font-semibold">{members.length} total</span>
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add New Member
          </button>
        </header>

        {/* Filters */}
        <div
          className="p-4 rounded-2xl mb-5 flex items-center gap-4 flex-wrap"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email or plan..."
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-theme text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30"
              style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
            {["ALL", "ACTIVE", "DUE", "FROZEN"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all`}
                style={filterStatus === s
                  ? { backgroundColor: "var(--primary)", color: "#fff" }
                  : { backgroundColor: "var(--badge-bg)", color: "var(--foreground-muted)" }
                }
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-theme-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading members...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-theme-muted">
              <Users className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold">No members found</p>
              <p className="text-xs opacity-70">
                {search ? "Try a different search term" : "Click 'Add New Member' to get started"}
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr style={{ backgroundColor: "var(--badge-bg)" }}>
                  {["Member", "Phone", "Plan", "Status", "Fee Due", "Joined", "Actions"].map((h) => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-bold text-theme-muted uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => setViewTarget(member)}
                    className="transition-colors group cursor-pointer"
                    style={{ borderTop: "1px solid var(--card-border)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                          {avatar(member)}
                        </div>
                        <div>
                          <p className="font-semibold text-theme text-sm">{member.name}</p>
                          {member.email && <p className="text-xs text-theme-muted truncate max-w-[150px]">{member.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-theme-muted text-sm font-medium">{member.phone}</td>
                    <td className="px-5 py-4">
                      {member.plan ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg text-primary" style={{ backgroundColor: "var(--badge-bg)" }}>
                          {planLabel(member.plan, plans)}
                        </span>
                      ) : <span className="text-theme-muted text-sm">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle(member.status)}`}>
                        {member.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-theme-muted text-sm">{fmtDate(member.feeDueDate)}</td>
                    <td className="px-5 py-4 text-theme-muted text-sm">{fmtDate(member.joinDate)}</td>
                    <td className="px-5 py-4">
                      <div 
                        className="flex items-center justify-end gap-1.5 relative flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Freeze / Unfreeze */}
                        {member.status !== "FROZEN" ? (
                          <button
                            onClick={() => performAction(member.id, "freeze")}
                            disabled={actionLoading === member.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                            style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#60a5fa" }}
                            title="Freeze membership"
                          >
                            {actionLoading === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Snowflake className="w-3 h-3" />}
                            Freeze
                          </button>
                        ) : (
                          <button
                            onClick={() => performAction(member.id, "unfreeze")}
                            disabled={actionLoading === member.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                            style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                            title="Unfreeze membership"
                          >
                            {actionLoading === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                            Unfreeze
                          </button>
                        )}

                        {/* Activate (only shown when DUE) */}
                        {member.status === "DUE" && (
                          <button
                            onClick={() => performAction(member.id, "activate")}
                            disabled={actionLoading === member.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-40"
                            style={{ backgroundColor: "rgba(249,115,22,0.15)", color: "var(--primary)" }}
                            title="Renew & activate membership from today"
                          >
                            {actionLoading === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            Activate
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => openEdit(member)}
                          className="p-2 rounded-lg transition-all"
                          style={{ backgroundColor: "var(--badge-bg)", color: "var(--foreground-muted)" }}
                          title="Edit member"
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--primary)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--foreground-muted)"; }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteId(deleteId === member.id ? null : member.id)}
                          className="p-2 rounded-lg transition-all"
                          style={{ backgroundColor: "var(--badge-bg)", color: "var(--foreground-muted)" }}
                          title="Delete member"
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--foreground-muted)"; }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Member count footer */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-theme-muted mt-3 text-right">
            Showing {filtered.length} of {members.length} members
          </p>
        )}
      </main>

      {/* Member Form Panel */}
      {formOpen && (
        <MemberFormPanel
          initial={editTarget}
          plans={plans}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); fetchMembers(); }}
        />
      )}

      {/* Standalone Delete Modal */}
      {deleteId && members.find(m => m.id === deleteId) && (
        <DeleteConfirm
          name={members.find(m => m.id === deleteId)!.name}
          onCancel={() => setDeleteId(null)}
          onConfirm={() => handleDelete(deleteId)}
          loading={deleting}
        />
      )}

      {/* Member Detail Panel */}
      {viewTarget && (
        <MemberDetailPanel
          member={viewTarget}
          plans={plans}
          onClose={() => setViewTarget(null)}
          onEdit={() => { setViewTarget(null); openEdit(viewTarget); }}
        />
      )}

      {/* Slide-in animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
