import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Clock3, MapPin, Phone, Mail, UserRound, Sparkles,
  ShieldCheck, LockKeyhole, Eye, EyeOff, Settings2, Users, Wallet,
  ClipboardList, Plus, Pencil, Trash2, Check, X, ChevronRight, Menu,
  LogOut, CircleDollarSign, Database, ExternalLink, Copy, RefreshCw,
  Heart, Waves, Flame, Leaf, BadgeCheck, AlertCircle, CheckCircle2,
  Search, SlidersHorizontal, Info, Moon, Sun, ArrowLeft, Save
} from "lucide-react";

/**
 * Single-file booking app starter.
 * UI data is stored in localStorage for preview. For production, configure Supabase
 * and move owner authentication / privileged writes to a trusted server or Supabase Auth + RLS.
 */
const STORAGE_KEY = "personalized-massage-v1";
const ADMIN_KEY = "personalized-owner-password";
const DEFAULT_PASSWORD = "ChangeMe-123!";
const servicesSeed = [
  { id: "deep", name: "Deep Tissue Therapy", description: "Focused pressure for areas of tension and tight muscles.", price: 85, tag: "Targeted relief", available: true, icon: "flame" },
  { id: "hot", name: "Hot Stone & Hot Tub Sessions", description: "A warming, restorative session designed to help you unwind.", price: 110, tag: "Warm & restore", available: true, icon: "waves" },
  { id: "relax", name: "Relaxing Body Rubs", description: "A soothing full-body relaxation experience.", price: 75, tag: "Guest favorite", available: true, icon: "leaf" },
  { id: "nuru", name: "Specialty Nuru Massage", description: "A specialty, client-led bodywork session. Boundaries and consent are discussed before the session.", price: 140, tag: "Specialty", available: true, icon: "heart" },
  { id: "custom", name: "Customized Treatments", description: "A personalized session shaped around your preferences and comfort.", price: 95, tag: "Made for you", available: true, icon: "sparkles" },
  { id: "happy", name: "Happy Ending", description: "Availability and scope must be clarified directly with the provider before booking.", price: 160, tag: "Ask first", available: false, icon: "heart" },
];
const durationSeed = { "30": 0.6, "60": 1, "90": 1.4, "120": 1.8, overnight: 4.5 };
const paymentSeed = [
  { id: "cash", name: "Cash", enabled: true, instructions: "Pay the remaining balance in cash after your session." },
  { id: "transfer", name: "Bank transfer", enabled: true, instructions: "A payment reference and transfer details will be shared after confirmation." },
  { id: "card", name: "Card payment", enabled: false, instructions: "Card checkout is not configured yet." },
];
const therapistsSeed = [
  { id: "t1", name: "Jordan", phone: "", avatar: "", bio: "Calm, attentive, and focused on a personalized experience.", active: true },
  { id: "t2", name: "Taylor", phone: "", avatar: "", bio: "Specializes in relaxation and tailored treatment sessions.", active: true },
];
const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n || 0));
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const readStore = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
};
const initialData = () => {
  const saved = readStore();
  return {
    services: saved?.services || servicesSeed,
    durations: saved?.durations || durationSeed,
    payments: saved?.payments || paymentSeed,
    therapists: saved?.therapists || therapistsSeed,
    bookings: saved?.bookings || [],
    checkoutInstructions: saved?.checkoutInstructions || "A 50% deposit is required to secure your appointment. Your booking is not confirmed until availability and deposit are verified.",
  };
};
const IconFor = ({ type, size = 20 }) => {
  const props = { size, strokeWidth: 1.7 };
  if (type === "flame") return <Flame {...props} />;
  if (type === "waves") return <Waves {...props} />;
  if (type === "leaf") return <Leaf {...props} />;
  if (type === "heart") return <Heart {...props} />;
  return <Sparkles {...props} />;
};
const Field = ({ label, children, hint }) => <label className="block space-y-2"><span className="text-sm font-medium text-stone-700">{label}</span>{children}{hint && <span className="block text-xs text-stone-500">{hint}</span>}</label>;
const inputClass = "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10";
const Button = ({ children, onClick, variant = "primary", type = "button", disabled = false, className = "" }) => <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${variant === "primary" ? "bg-emerald-900 text-white hover:bg-emerald-800" : variant === "light" ? "bg-stone-100 text-stone-800 hover:bg-stone-200" : variant === "outline" ? "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50" : "text-stone-500 hover:bg-stone-100"} ${className}`}>{children}</button>;
const SectionTitle = ({ eyebrow, title, description }) => <div className="mb-8 max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-emerald-800">{eyebrow}</p><h2 className="font-serif text-3xl leading-tight text-stone-900 sm:text-4xl">{title}</h2>{description && <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">{description}</p>}</div>;

export default function App() {
  const [data, setData] = useState(initialData);
  const [selectedService, setSelectedService] = useState("relax");
  const [duration, setDuration] = useState("60");
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "", date: "", time: "", therapistId: "", paymentId: "cash", depositAccepted: false, notes: "" });
  const [notice, setNotice] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminTab, setAdminTab] = useState("bookings");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [therapistDraft, setTherapistDraft] = useState(null);
  const [paymentDraft, setPaymentDraft] = useState(null);
  const [serviceDraft, setServiceDraft] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => {
    if (notice) { const id = setTimeout(() => setNotice(null), 4500); return () => clearTimeout(id); }
  }, [notice]);

  const activeServices = data.services.filter(s => s.available);
  const service = data.services.find(s => s.id === selectedService) || activeServices[0] || data.services[0];
  const chosenTherapist = data.therapists.find(t => t.id === form.therapistId && t.active);
  const activePayments = data.payments.filter(p => p.enabled);
  const multiplier = Number(data.durations[duration] || 1);
  const total = Math.round((Number(service?.price || 0) * multiplier) * 100) / 100;
  const deposit = Math.round(total * 0.5 * 100) / 100;
  const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const matchingBookings = data.bookings.filter(b => {
    const statusOk = bookingFilter === "all" || b.status === bookingFilter;
    const search = bookingSearch.toLowerCase();
    return statusOk && (!search || `${b.name} ${b.phone} ${b.email} ${b.serviceName} ${b.location}`.toLowerCase().includes(search));
  });

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const updateData = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const showNotice = (type, text) => setNotice({ type, text });

  const checkAvailability = () => {
    if (!form.date || !form.time) return { ok: false, message: "Choose a date and time first." };
    const requested = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(requested.getTime()) || requested <= new Date()) return { ok: false, message: "Please choose a future date and time." };
    const sameSlot = data.bookings.some(b => b.date === form.date && b.time === form.time && b.therapistId === form.therapistId && !["cancelled", "declined"].includes(b.status));
    if (sameSlot) return { ok: false, message: "That therapist already has a booking at this time. Please choose another slot." };
    return { ok: true, message: "This slot looks available in the current booking list." };
  };

  const submitBooking = (e) => {
    e.preventDefault();
    if (!service || !service.available) return showNotice("error", "Please choose an available service.");
    if (!form.depositAccepted) return showNotice("error", "Please accept the 50% deposit agreement to continue.");
    if (!form.therapistId) return showNotice("error", "Please select a therapist.");
    const availability = checkAvailability();
    if (!availability.ok) return showNotice("error", availability.message);
    const selectedPayment = data.payments.find(p => p.id === form.paymentId);
    const booking = {
      id: `BK-${newId().toUpperCase()}`, ...form, serviceId: service.id, serviceName: service.name,
      duration, multiplier, total, depositDue: deposit, depositPaid: false,
      therapistName: chosenTherapist?.name || "Not assigned", paymentName: selectedPayment?.name || "Not selected",
      status: "pending", createdAt: new Date().toISOString()
    };
    updateData("bookings", [booking, ...data.bookings]);
    setForm({ name: "", phone: "", email: "", location: "", date: "", time: "", therapistId: "", paymentId: activePayments[0]?.id || "cash", depositAccepted: false, notes: "" });
    showNotice("success", `Request ${booking.id} saved. It is pending availability and deposit verification.`);
  };

  const authenticate = (e) => {
    e.preventDefault();
    const stored = localStorage.getItem(ADMIN_KEY) || DEFAULT_PASSWORD;
    if (password === stored) { setAdminAuthed(true); setPassword(""); showNotice("success", "Owner panel unlocked on this device."); }
    else showNotice("error", "Incorrect password.");
  };
  const saveNewPassword = () => {
    if (passwordDraft.trim().length < 10) return showNotice("error", "Use at least 10 characters for the new password.");
    localStorage.setItem(ADMIN_KEY, passwordDraft);
    setPasswordDraft("");
    showNotice("success", "Local owner password updated on this device.");
  };
  const resetPassword = () => {
    localStorage.removeItem(ADMIN_KEY);
    setShowResetConfirm(false);
    setPassword("");
    showNotice("success", "Local password reset to the starter password. Change it immediately.");
  };
  const setBookingField = (id, patch) => updateData("bookings", data.bookings.map(b => b.id === id ? { ...b, ...patch } : b));
  const deleteBooking = (id) => updateData("bookings", data.bookings.filter(b => b.id !== id));
  const saveService = () => {
    if (!serviceDraft?.name?.trim()) return showNotice("error", "Service name is required.");
    const exists = data.services.some(s => s.id === serviceDraft.id);
    updateData("services", exists ? data.services.map(s => s.id === serviceDraft.id ? { ...serviceDraft, price: Number(serviceDraft.price) || 0 } : s) : [...data.services, { ...serviceDraft, id: newId(), price: Number(serviceDraft.price) || 0 }]);
    setServiceDraft(null);
    showNotice("success", "Service saved.");
  };
  const saveTherapist = () => {
    if (!therapistDraft?.name?.trim()) return showNotice("error", "Therapist name is required.");
    const exists = data.therapists.some(t => t.id === therapistDraft.id);
    updateData("therapists", exists ? data.therapists.map(t => t.id === therapistDraft.id ? therapistDraft : t) : [...data.therapists, { ...therapistDraft, id: newId(), active: true }]);
    setTherapistDraft(null);
    showNotice("success", "Therapist saved.");
  };
  const savePayment = () => {
    if (!paymentDraft?.name?.trim()) return showNotice("error", "Payment method name is required.");
    const exists = data.payments.some(p => p.id === paymentDraft.id);
    updateData("payments", exists ? data.payments.map(p => p.id === paymentDraft.id ? paymentDraft : p) : [...data.payments, { ...paymentDraft, id: newId(), enabled: true }]);
    setPaymentDraft(null);
    showNotice("success", "Payment option saved.");
  };
  const resetLocalDemo = () => {
    if (!window.confirm("Reset all local demo data on this device? This cannot be undone.")) return;
    localStorage.removeItem(STORAGE_KEY); setData(initialData()); showNotice("success", "Demo data reset.");
  };

  const closeAdmin = () => { setAdminOpen(false); setAdminAuthed(false); setPassword(""); setMobileMenu(false); };
  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-800">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap'); body{font-family:'DM Sans',sans-serif} .font-serif{font-family:'Playfair Display',serif} html{scroll-behavior:smooth}`}</style>
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#fbfaf7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#home" className="flex items-center gap-3" aria-label="Home">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950 text-amber-100"><Sparkles size={19}/></span>
            <span><span className="block font-serif text-lg leading-tight text-stone-900">Still & Bloom</span><span className="block text-[10px] uppercase tracking-[.22em] text-stone-500">Personalized bodywork</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
            <a href="#services" className="hover:text-emerald-900">Services</a><a href="#therapists" className="hover:text-emerald-900">Our therapists</a><a href="#booking" className="hover:text-emerald-900">Book a session</a>
          </nav>
          <div className="flex items-center gap-2"><a href="#booking" className="hidden rounded-full bg-emerald-950 px-5 py-3 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:inline-flex">Reserve a session <ChevronRight size={15}/></a><button className="rounded-xl p-2 md:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu size={22}/></button></div>
        </div>
        {mobileMenu && <div className="border-t border-stone-200 px-5 py-4 md:hidden"><div className="flex flex-col gap-4 text-sm"><a href="#services" onClick={() => setMobileMenu(false)}>Services</a><a href="#therapists" onClick={() => setMobileMenu(false)}>Our therapists</a><a href="#booking" onClick={() => setMobileMenu(false)}>Book a session</a></div></div>}
      </header>

      <main id="home">
        <section className="relative overflow-hidden bg-[#172c25] text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 70% 20%, #d4b780 0%, transparent 35%), radial-gradient(ellipse at 15% 90%, #8caa8c 0%, transparent 40%)" }} />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-32">
            <div><p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[.2em] text-amber-100"><Sparkles size={13}/> Thoughtful care, tailored to you</p><h1 className="max-w-3xl font-serif text-5xl leading-[1.06] sm:text-6xl lg:text-7xl">WELCOME TO A <span className="italic text-[#d7c29a]">PERSONALIZED</span> EXPERIENCE</h1><p className="mt-7 max-w-xl text-base leading-7 text-stone-200 sm:text-lg">Make room to slow down. Explore considered treatments, choose your preferred therapist, and request a session designed around your comfort.</p><div className="mt-9 flex flex-wrap gap-3"><a href="#booking" className="inline-flex items-center gap-2 rounded-full bg-[#d7c29a] px-6 py-4 text-sm font-bold text-emerald-950 hover:bg-amber-100">Book your moment <ChevronRight size={17}/></a><a href="#services" className="inline-flex items-center rounded-full border border-white/30 px-6 py-4 text-sm font-semibold text-white hover:bg-white/10">Explore treatments</a></div><div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-xs text-stone-300"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#d7c29a]"/> Comfort-first approach</span><span className="flex items-center gap-2"><CalendarDays size={16} className="text-[#d7c29a]"/> Appointment requests</span></div></div>
            <div className="relative mx-auto w-full max-w-lg"><div className="absolute -inset-4 rounded-[2rem] border border-white/10 rotate-3"/><div className="relative overflow-hidden rounded-[1.7rem] bg-[#e5dfd1] p-3"><div className="flex min-h-[390px] flex-col justify-between rounded-[1.2rem] bg-gradient-to-br from-[#b8c4b3] via-[#e9dfca] to-[#a8b7a8] p-7 text-emerald-950 sm:min-h-[480px] sm:p-10"><div className="flex justify-between"><span className="rounded-full bg-white/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em]">A softer pace</span><Sparkles size={22}/></div><div><div className="mb-5 h-px w-16 bg-emerald-900/50"/><p className="font-serif text-4xl leading-tight sm:text-5xl">Rest is not a reward.<br/><span className="italic">It's part of you.</span></p><p className="mt-5 max-w-xs text-sm leading-6 text-emerald-950/75">Personalized sessions in a calm, welcoming setting.</p></div><div className="flex items-end justify-between"><span className="text-[10px] uppercase tracking-[.2em]">Still & Bloom Studio</span><div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-950/30"><Leaf size={26}/></div></div></div></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24" id="services">
          <SectionTitle eyebrow="The treatment menu" title="Care that meets you where you are." description="Choose a session that suits your needs. Prices update automatically when you select a duration in the booking form."/>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.services.map(s => <article key={s.id} className={`group rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-200/50 ${!s.available ? "opacity-60" : ""}`}><div className="mb-6 flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf1e9] text-emerald-900"><IconFor type={s.icon} size={23}/></span><span className="rounded-full bg-stone-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-600">{s.tag || "Personalized"}</span></div><h3 className="font-serif text-xl text-stone-900">{s.name}</h3><p className="mt-3 min-h-[48px] text-sm leading-6 text-stone-600">{s.description}</p><div className="mt-6 flex items-end justify-between border-t border-stone-100 pt-5"><div><span className="text-xs text-stone-500">Starting at</span><p className="font-serif text-2xl">{money(s.price)}</p></div>{s.available ? <button onClick={() => { setSelectedService(s.id); document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" }); }} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-900">Select <ChevronRight size={16}/></button> : <span className="text-xs font-semibold text-stone-500">Currently unavailable</span>}</div></article>)}</div>
        </section>

        <section id="therapists" className="border-y border-stone-200 bg-[#f2f0e9]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><SectionTitle eyebrow="The people behind the care" title="Meet your therapist." description="Choose an active therapist for your appointment request. Your selection is subject to confirmation."/><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.therapists.filter(t => t.active).map((t, i) => <div key={t.id} className="flex gap-5 rounded-2xl bg-white p-5 shadow-sm"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dfe7db] text-emerald-900">{t.avatar ? <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }}/> : <UserRound size={30}/>}</div><div className="pt-1"><div className="flex items-center gap-2"><h3 className="font-serif text-xl">{t.name}</h3><BadgeCheck size={15} className="text-emerald-800"/></div><p className="mt-2 text-sm leading-6 text-stone-600">{t.bio || "Focused on your comfort and preferences."}</p><span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[.16em] text-emerald-800">Accepting requests</span></div></div>)}{!data.therapists.some(t => t.active) && <p className="rounded-xl bg-white p-6 text-sm text-stone-600">Therapist profiles will appear here when available.</p>}</div></div></section>

        <section id="booking" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div className="lg:sticky lg:top-28 lg:self-start"><SectionTitle eyebrow="Your time, your way" title="Request your appointment." description="Complete the details below. We'll check the selected time against the bookings saved on this device and mark your request pending confirmation."/><div className="rounded-2xl bg-[#172c25] p-6 text-white"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><LockKeyhole size={19}/></span><div><h3 className="font-semibold">A clear deposit policy</h3><p className="mt-1 text-xs text-stone-300">Simple, upfront pricing</p></div></div><p className="mt-4 text-sm leading-6 text-stone-300">{data.checkoutInstructions}</p><div className="mt-5 border-t border-white/15 pt-4 text-xs text-stone-300">Your request remains pending until a real person confirms the slot and deposit. Please do not submit sensitive payment details here.</div></div></div>
            <form onSubmit={submitBooking} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">01 / Your details</p><h3 className="mt-2 font-serif text-2xl">Let's get to know you</h3></div><span className="rounded-full bg-stone-100 px-3 py-2 text-xs text-stone-500">Required fields *</span></div>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Full name *"><input className={inputClass} required value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="Your full name" autoComplete="name"/></Field><Field label="Phone number *"><input className={inputClass} required type="tel" value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="+1 555 000 0000" autoComplete="tel"/></Field><Field label="Email address *"><input className={inputClass} required type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="you@example.com" autoComplete="email"/></Field><Field label="Session location / address *"><input className={inputClass} required value={form.location} onChange={e => updateForm("location", e.target.value)} placeholder="Address or preferred location" autoComplete="street-address"/></Field></div>
              <div className="mb-7 mt-9 border-t border-stone-100 pt-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">02 / Your treatment</p><h3 className="mt-2 font-serif text-2xl">Build your session</h3></div>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Service *"><select className={inputClass} value={selectedService} onChange={e => setSelectedService(e.target.value)} required>{activeServices.map(s => <option key={s.id} value={s.id}>{s.name} — {money(s.price)} base</option>)}</select></Field><Field label="Duration *"><select className={inputClass} value={duration} onChange={e => setDuration(e.target.value)}>{Object.keys(durationSeed).map(d => <option key={d} value={d}>{d === "overnight" ? "Overnight" : `${d} minutes`} · ×{Number(data.durations[d] ?? durationSeed[d]).toFixed(2).replace(/0$/, "")}</option>)}</select></Field><Field label="Date *"><input className={inputClass} type="date" min={minDate} required value={form.date} onChange={e => updateForm("date", e.target.value)}/></Field><Field label="Start time *"><input className={inputClass} type="time" required value={form.time} onChange={e => updateForm("time", e.target.value)}/></Field><Field label="Preferred therapist *"><select className={inputClass} required value={form.therapistId} onChange={e => updateForm("therapistId", e.target.value)}><option value="">Choose a therapist</option>{data.therapists.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field><Field label="Payment method *"><select className={inputClass} required value={form.paymentId} onChange={e => updateForm("paymentId", e.target.value)}>{activePayments.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field></div>
              <div className="mt-5"><Field label="Preferences or accessibility notes" hint="Optional. Please don't include payment card details or other sensitive information."><textarea className={`${inputClass} min-h-[90px] resize-y`} value={form.notes} onChange={e => updateForm("notes", e.target.value)} placeholder="Anything you'd like your therapist to know?"/></Field></div>
              <div className="mt-6 rounded-2xl bg-[#f4f5ef] p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Your estimate</p><p className="mt-1 text-xs text-stone-500">Base price × selected duration multiplier</p></div><CircleDollarSign size={23} className="text-emerald-900"/></div><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-stone-600">Base service price</span><span>{money(service?.price)}</span></div><div className="flex justify-between"><span className="text-stone-600">Duration multiplier</span><span>×{multiplier.toFixed(2).replace(/0$/, "")}</span></div><div className="flex justify-between border-t border-stone-200 pt-3 font-semibold"><span>Estimated total</span><span>{money(total)}</span></div><div className="flex justify-between text-emerald-900"><span>50% deposit to request booking</span><span className="font-bold">{money(deposit)}</span></div></div></div>
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-4"><input className="mt-1 h-4 w-4 accent-emerald-900" type="checkbox" required checked={form.depositAccepted} onChange={e => updateForm("depositAccepted", e.target.checked)}/><span className="text-sm leading-6 text-stone-700"><strong>50% Deposit Agreement *</strong><br/>I understand that a 50% deposit is required to secure my appointment, and that my request is pending until the provider confirms availability and deposit receipt.</span></label>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button type="submit" className="flex-1 py-4">Request appointment <ChevronRight size={17}/></Button><Button type="button" variant="outline" onClick={() => { const a = checkAvailability(); showNotice(a.ok ? "success" : "error", a.message); }}><CalendarDays size={16}/> Check slot</Button></div><p className="mt-4 text-center text-xs leading-5 text-stone-500">Availability is checked against this browser's saved requests only. It is not a live shared calendar until a database and scheduling backend are connected.</p>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-[#172c25] text-white"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><p className="font-serif text-2xl">Still & Bloom</p><p className="mt-2 text-xs text-stone-300">Personalized care. A little more room to breathe.</p></div><div className="flex flex-wrap gap-5 text-xs text-stone-300"><a href="#services" className="hover:text-white">Treatments</a><a href="#booking" className="hover:text-white">Book a session</a><button onClick={() => { setAdminOpen(true); setAdminAuthed(false); }} className="inline-flex items-center gap-2 text-stone-300 hover:text-white"><Settings2 size={14}/> Owner access</button></div><p className="text-xs text-stone-400">© {new Date().getFullYear()} Still & Bloom</p></div></footer>

      {notice && <div role="status" className={`fixed bottom-5 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-2xl px-5 py-4 shadow-2xl ${notice.type === "error" ? "bg-red-950 text-white" : "bg-emerald-950 text-white"}`}><span className="mt-0.5">{notice.type === "error" ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}</span><p className="flex-1 text-sm leading-5">{notice.text}</p><button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={17}/></button></div>}

      {adminOpen && <div className="fixed inset-0 z-[70] flex items-stretch justify-center bg-stone-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5">
        <div className="flex max-h-screen w-full max-w-7xl flex-col overflow-hidden bg-[#fbfaf7] shadow-2xl sm:max-h-[94vh] sm:rounded-3xl">
          <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950 text-white"><Settings2 size={19}/></span><div><p className="font-serif text-xl">Owner workspace</p><p className="text-xs text-stone-500">Private management tools</p></div></div><button onClick={closeAdmin} className="rounded-xl p-2 hover:bg-stone-100" aria-label="Close owner panel"><X size={21}/></button></div>
          {!adminAuthed ? <div className="flex flex-1 items-center justify-center overflow-y-auto p-5 sm:p-10"><form onSubmit={authenticate} className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-9"><span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf1e9] text-emerald-950"><LockKeyhole size={25}/></span><h2 className="font-serif text-3xl">Owner sign in</h2><p className="mt-3 text-sm leading-6 text-stone-600">Enter your owner password to manage bookings, therapists, prices, and publishing instructions.</p><div className="mt-7"><Field label="Password"><div className="relative"><input className={`${inputClass} pr-12`} type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter owner password" required/><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-500" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></Field></div><Button type="submit" className="mt-5 w-full">Unlock owner panel <ChevronRight size={16}/></Button><div className="mt-5 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900"><strong>Starter password:</strong> ChangeMe-123!<br/>This demo password is stored locally and is not secure authentication. Replace it before showing the site publicly.</div><button type="button" className="mt-4 w-full text-xs text-stone-500 underline" onClick={() => setShowResetConfirm(true)}>Emergency local password reset</button></form></div> :
          <div className="flex min-h-0 flex-1 flex-col md:flex-row"><aside className="border-b border-stone-200 bg-white p-3 md:w-60 md:border-b-0 md:border-r md:p-4"><div className="flex gap-2 overflow-x-auto md:flex-col">{[{id:"bookings",label:"Booking tracker",icon:ClipboardList},{id:"therapists",label:"Therapists",icon:Users},{id:"services",label:"Services & rates",icon:CircleDollarSign},{id:"payments",label:"Payments",icon:Wallet},{id:"publishing",label:"Publishing guide",icon:Database},{id:"security",label:"Security",icon:ShieldCheck}].map(item => <button key={item.id} onClick={() => setAdminTab(item.id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${adminTab === item.id ? "bg-emerald-950 text-white" : "text-stone-600 hover:bg-stone-100"}`}><item.icon size={17}/><span>{item.label}</span></button>)}</div><div className="mt-5 hidden border-t border-stone-200 pt-4 md:block"><button onClick={() => { setAdminAuthed(false); setPassword(""); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-stone-600 hover:bg-stone-100"><LogOut size={16}/> Lock panel</button></div></aside>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
              {adminTab === "bookings" && <div><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">Overview</p><h2 className="mt-2 font-serif text-3xl">Booking tracker</h2><p className="mt-2 text-sm text-stone-500">Review customer details and update request, deposit, and booking status.</p></div><div className="rounded-2xl bg-white px-5 py-3 text-right shadow-sm"><p className="text-xs text-stone-500">Total requests</p><p className="font-serif text-2xl">{data.bookings.length}</p></div></div><div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/><input className={`${inputClass} pl-10`} placeholder="Search name, phone, service, location…" value={bookingSearch} onChange={e => setBookingSearch(e.target.value)}/></div><div className="relative"><SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/><select className={`${inputClass} pl-9 sm:w-48`} value={bookingFilter} onChange={e => setBookingFilter(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="declined">Declined</option></select></div></div>
                <div className="space-y-4">{matchingBookings.map(b => <article key={b.id} className="rounded-2xl border border-stone-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{b.name}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${b.status === "confirmed" ? "bg-emerald-100 text-emerald-900" : b.status === "cancelled" || b.status === "declined" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>{b.status}</span><span className="text-xs text-stone-400">{b.id}</span></div><p className="mt-1 text-sm text-stone-600">{b.serviceName} · {b.duration === "overnight" ? "Overnight" : `${b.duration} min`} · {b.date} at {b.time}</p></div><div className="text-right"><p className="font-serif text-xl">{money(b.total)}</p><p className="text-xs text-stone-500">Deposit due {money(b.depositDue)}</p></div></div><div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><p className="flex items-start gap-2 text-stone-600"><Phone size={15} className="mt-0.5 shrink-0"/>{b.phone}</p><p className="flex items-start gap-2 break-all text-stone-600"><Mail size={15} className="mt-0.5 shrink-0"/>{b.email}</p><p className="flex items-start gap-2 text-stone-600"><MapPin size={15} className="mt-0.5 shrink-0"/>{b.location}</p><p className="flex items-start gap-2 text-stone-600"><UserRound size={15} className="mt-0.5 shrink-0"/>Therapist: {b.therapistName}</p><p className="flex items-start gap-2 text-stone-600"><Wallet size={15} className="mt-0.5 shrink-0"/>{b.paymentName} · Deposit {b.depositPaid ? "received" : "not received"}</p>{b.notes && <p className="sm:col-span-2 lg:col-span-3"><span className="font-medium">Notes:</span> {b.notes}</p>}</div><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4"><label className="text-xs text-stone-500">Status <select className="ml-2 rounded-lg border border-stone-200 bg-white px-2 py-2 text-xs" value={b.status} onChange={e => setBookingField(b.id, { status: e.target.value })}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="declined">Declined</option></select></label><label className="flex items-center gap-2 text-xs text-stone-600"><input type="checkbox" className="accent-emerald-900" checked={!!b.depositPaid} onChange={e => setBookingField(b.id, { depositPaid: e.target.checked })}/> Deposit received</label><div className="flex-1"/><Button variant="ghost" onClick={() => { if (window.confirm("Delete this booking permanently from this browser?")) deleteBooking(b.id); }}><Trash2 size={15}/> Delete</Button></div></article>)}{matchingBookings.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center"><ClipboardList size={28} className="mx-auto text-stone-400"/><p className="mt-3 font-medium">No matching bookings yet</p><p className="mt-1 text-sm text-stone-500">New appointment requests will appear here.</p></div>}</div></div>}

              {adminTab === "therapists" && <div><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-serif text-3xl">Therapist management</h2><p className="mt-2 text-sm text-stone-500">Manage profiles and control who appears in the booking form.</p></div><Button onClick={() => setTherapistDraft({ id: "", name: "", phone: "", avatar: "", bio: "", active: true })}><Plus size={16}/> Add therapist</Button></div><div className="space-y-3">{data.therapists.map(t => <div key={t.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#edf1e9] text-emerald-900">{t.avatar ? <img src={t.avatar} alt="" className="h-full w-full object-cover"/> : <UserRound size={20}/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{t.name}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${t.active ? "bg-emerald-100 text-emerald-900" : "bg-stone-100 text-stone-500"}`}>{t.active ? "Active" : "Inactive"}</span></div><p className="mt-1 truncate text-sm text-stone-500">{t.bio}</p><p className="mt-1 text-xs text-stone-400">{t.phone || "No phone added"}</p></div><Button variant="outline" onClick={() => updateData("therapists", data.therapists.map(x => x.id === t.id ? { ...x, active: !x.active } : x))}>{t.active ? "Deactivate" : "Activate"}</Button><Button variant="light" onClick={() => setTherapistDraft({ ...t })}><Pencil size={15}/></Button><Button variant="ghost" onClick={() => { if (window.confirm(`Delete therapist ${t.name}? Existing booking records remain unchanged.`)) updateData("therapists", data.therapists.filter(x => x.id !== t.id)); }}><Trash2 size={15}/></Button></div>)}</div>{therapistDraft && <div className="mt-5 rounded-2xl border border-emerald-900/20 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-xl">{therapistDraft.id ? "Edit therapist" : "Add therapist"}</h3><button onClick={() => setTherapistDraft(null)}><X size={18}/></button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Name *"><input className={inputClass} value={therapistDraft.name} onChange={e => setTherapistDraft({ ...therapistDraft, name: e.target.value })}/></Field><Field label="Phone number"><input className={inputClass} value={therapistDraft.phone} onChange={e => setTherapistDraft({ ...therapistDraft, phone: e.target.value })}/></Field><Field label="Avatar image URL"><input className={inputClass} value={therapistDraft.avatar} onChange={e => setTherapistDraft({ ...therapistDraft, avatar: e.target.value })} placeholder="https://…"/></Field><Field label="Bio"><input className={inputClass} value={therapistDraft.bio} onChange={e => setTherapistDraft({ ...therapistDraft, bio: e.target.value })}/></Field></div><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-emerald-900" checked={therapistDraft.active} onChange={e => setTherapistDraft({ ...therapistDraft, active: e.target.checked })}/> Active and bookable</label><div className="mt-5 flex gap-2"><Button onClick={saveTherapist}><Save size={15}/> Save therapist</Button><Button variant="outline" onClick={() => setTherapistDraft(null)}>Cancel</Button></div></div>}</div>}

              {adminTab === "services" && <div><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-serif text-3xl">Services & rates</h2><p className="mt-2 text-sm text-stone-500">Edit base prices, service visibility, and duration multipliers.</p></div><Button onClick={() => setServiceDraft({ id: "", name: "", description: "", price: 0, tag: "New", available: true, icon: "sparkles" })}><Plus size={16}/> Add service</Button></div><div className="space-y-3">{data.services.map(s => <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf1e9] text-emerald-900"><IconFor type={s.icon}/></span><div className="min-w-0 flex-1"><p className="font-semibold">{s.name}</p><p className="mt-1 text-xs text-stone-500">{s.tag} · Base {money(s.price)}</p></div><label className="flex items-center gap-2 text-xs text-stone-600"><input type="checkbox" className="accent-emerald-900" checked={s.available} onChange={e => updateData("services", data.services.map(x => x.id === s.id ? { ...x, available: e.target.checked } : x))}/> Available</label><Button variant="light" onClick={() => setServiceDraft({ ...s })}><Pencil size={15}/> Edit</Button></div>)}</div><div className="mt-7 rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl">Duration multipliers</h3><p className="mt-1 text-sm text-stone-500">Set how the base price scales for each session length.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.keys(durationSeed).map(d => <Field key={d} label={d === "overnight" ? "Overnight multiplier" : `${d} minute multiplier`}><div className="flex items-center gap-2"><span className="text-stone-400">×</span><input className={inputClass} type="number" min="0" step="0.05" value={data.durations[d] ?? durationSeed[d]} onChange={e => updateData("durations", { ...data.durations, [d]: Number(e.target.value) })}/></div></Field>)}</div></div>{serviceDraft && <div className="mt-5 rounded-2xl border border-emerald-900/20 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-xl">{serviceDraft.id ? "Edit service" : "Add service"}</h3><button onClick={() => setServiceDraft(null)}><X size={18}/></button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Service name *"><input className={inputClass} value={serviceDraft.name} onChange={e => setServiceDraft({ ...serviceDraft, name: e.target.value })}/></Field><Field label="Base price (USD)"><input className={inputClass} type="number" min="0" value={serviceDraft.price} onChange={e => setServiceDraft({ ...serviceDraft, price: Number(e.target.value) })}/></Field><Field label="Tag"><input className={inputClass} value={serviceDraft.tag} onChange={e => setServiceDraft({ ...serviceDraft, tag: e.target.value })}/></Field><Field label="Icon"><select className={inputClass} value={serviceDraft.icon} onChange={e => setServiceDraft({ ...serviceDraft, icon: e.target.value })}><option value="sparkles">Sparkles</option><option value="flame">Flame</option><option value="waves">Waves</option><option value="leaf">Leaf</option><option value="heart">Heart</option></select></Field><div className="sm:col-span-2"><Field label="Description"><textarea className={inputClass} value={serviceDraft.description} onChange={e => setServiceDraft({ ...serviceDraft, description: e.target.value })}/></Field></div></div><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-emerald-900" checked={serviceDraft.available} onChange={e => setServiceDraft({ ...serviceDraft, available: e.target.checked })}/> Available for customer booking</label><div className="mt-5 flex gap-2"><Button onClick={saveService}><Save size={15}/> Save service</Button><Button variant="outline" onClick={() => setServiceDraft(null)}>Cancel</Button></div></div>}</div>}

              {adminTab === "payments" && <div><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-serif text-3xl">Payment options</h2><p className="mt-2 text-sm text-stone-500">Manage available checkout choices and customer-facing instructions.</p></div><Button onClick={() => setPaymentDraft({ id: "", name: "", enabled: true, instructions: "" })}><Plus size={16}/> Add payment option</Button></div><div className="space-y-3">{data.payments.map(p => <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf1e9] text-emerald-900"><Wallet size={19}/></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-semibold">{p.name}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${p.enabled ? "bg-emerald-100 text-emerald-900" : "bg-stone-100 text-stone-500"}`}>{p.enabled ? "Enabled" : "Disabled"}</span></div><p className="mt-1 text-xs text-stone-500">{p.instructions}</p></div><Button variant="outline" onClick={() => updateData("payments", data.payments.map(x => x.id === p.id ? { ...x, enabled: !x.enabled } : x))}>{p.enabled ? "Disable" : "Enable"}</Button><Button variant="light" onClick={() => setPaymentDraft({ ...p })}><Pencil size={15}/></Button><Button variant="ghost" onClick={() => { if (window.confirm(`Delete ${p.name}?`)) updateData("payments", data.payments.filter(x => x.id !== p.id)); }}><Trash2 size={15}/></Button></div>)}</div><div className="mt-7 rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl">Customer checkout instructions</h3><p className="mt-1 text-sm text-stone-500">Shown beside the booking form. Keep it clear and avoid asking customers to submit card details in this form.</p><textarea className={`${inputClass} mt-4 min-h-[120px]`} value={data.checkoutInstructions} onChange={e => updateData("checkoutInstructions", e.target.value)}/></div>{paymentDraft && <div className="mt-5 rounded-2xl border border-emerald-900/20 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-xl">{paymentDraft.id ? "Edit payment option" : "Add payment option"}</h3><button onClick={() => setPaymentDraft(null)}><X size={18}/></button></div><div className="grid gap-4"><Field label="Payment method name *"><input className={inputClass} value={paymentDraft.name} onChange={e => setPaymentDraft({ ...paymentDraft, name: e.target.value })}/></Field><Field label="Customer instructions"><textarea className={inputClass} value={paymentDraft.instructions} onChange={e => setPaymentDraft({ ...paymentDraft, instructions: e.target.value })}/></Field></div><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-emerald-900" checked={paymentDraft.enabled} onChange={e => setPaymentDraft({ ...paymentDraft, enabled: e.target.checked })}/> Enabled at checkout</label><div className="mt-5 flex gap-2"><Button onClick={savePayment}><Save size={15}/> Save payment option</Button><Button variant="outline" onClick={() => setPaymentDraft(null)}>Cancel</Button></div></div>}</div>}

              {adminTab === "publishing" && <div><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">Go live</p><h2 className="mt-2 font-serif text-3xl">Publishing guide</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Host the frontend for free on Netlify and use Supabase as the shared database. The current single-file demo stores data in this browser only; follow these steps to make it multi-device.</p></div><div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><div className="flex gap-3"><Info size={19} className="mt-0.5 shrink-0"/><p><strong>Important production note:</strong> a password stored in localStorage is not secure, and frontend-only availability checks can double-book. Use Supabase Auth for owner access, row-level security (RLS), and a server-side or database transaction for booking conflict checks. Never put a Supabase service-role key in the browser.</p></div></div><div className="space-y-5">{[
                {n:"1", title:"Create the React project", body:"Install Node.js, then run these commands in your terminal. Choose the Vite React template.", code:"npm create vite@latest still-and-bloom -- --template react\ncd still-and-bloom\nnpm install\nnpm install lucide-react @supabase/supabase-js\nnpm install -D tailwindcss @tailwindcss/vite"},
                {n:"2", title:"Add Tailwind and this app", body:"Configure the Tailwind Vite plugin in vite.config.js, import Tailwind in src/index.css, and replace src/App.jsx with this file's contents.", code:"// vite.config.js\nimport { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\nexport default defineConfig({ plugins: [react(), tailwindcss()] })"},
                {n:"3", title:"Create a free Supabase project", body:"Create a project at supabase.com, open SQL Editor → New query, paste the full SQL setup script below, and run it.", code:"VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co\nVITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY"},
                {n:"4", title:"Connect the app to Supabase", body:"Install @supabase/supabase-js and create a client using import.meta.env.VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.", code:"import { createClient } from '@supabase/supabase-js'\nexport const supabase = createClient(\n  import.meta.env.VITE_SUPABASE_URL,\n  import.meta.env.VITE_SUPABASE_ANON_KEY\n)"},
                {n:"5", title:"Deploy to Netlify for free", body:"Push the project to a GitHub repository. In Netlify choose Add new site → Import an existing project.", code:"# netlify.toml (optional)\n[build]\n  command = \"npm run build\"\n  publish = \"dist\"\n\n[[redirects]]\n  from = \"/*\"\n  to = \"/index.html\"\n  status = 200"},
                {n:"6", title:"Verify before sharing", body:"Test a booking as a customer, confirm it appears in Supabase, and check owner permissions.", code:"# Local preview\nnpm run dev\n\n# Production build check\nnpm run build"}
              ].map(step => <details key={step.n} className="group rounded-2xl border border-stone-200 bg-white p-5" open={step.n === "1"}><summary className="flex cursor-pointer list-none items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-sm font-bold text-white">{step.n}</span><span className="flex-1 font-semibold">{step.title}</span><ChevronRight size={17} className="transition group-open:rotate-90"/></summary><p className="mt-4 text-sm leading-6 text-stone-600">{step.body}</p><pre className="mt-4 overflow-x-auto rounded-xl bg-stone-950 p-4 text-xs leading-6 text-stone-100"><code>{step.code}</code></pre><button onClick={() => { navigator.clipboard?.writeText(step.code); showNotice("success", "Commands copied if clipboard access is available."); }} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-900"><Copy size={14}/> Copy commands</button></details>)}</div>
                <div className="mt-7 rounded-2xl border border-stone-200 bg-white p-5"><div className="mb-3 flex items-center gap-2"><Database size={19} className="text-emerald-900"/><h3 className="font-serif text-xl">Supabase SQL setup script</h3></div><p className="mb-4 text-sm leading-6 text-stone-500">Creates core tables, enables RLS, and limits owner-only management to authenticated users listed in owner_profiles.</p><pre className="max-h-[420px] overflow-auto rounded-xl bg-stone-950 p-4 text-xs leading-6 text-stone-100"><code>{`-- Run in Supabase SQL Editor. Review and adapt before production.
create extension if not exists pgcrypto;

create table if not exists public.owner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_owner()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.owner_profiles
    where user_id = auth.uid()
  );
$$;

create table if not exists public.therapists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  avatar_url text,
  bio text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  base_price numeric(10,2) not null default 0 check (base_price >= 0),
  tag text,
  icon text default 'sparkles',
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.duration_rates (
  duration_key text primary key check (duration_key in ('30','60','90','120','overnight')),
  multiplier numeric(8,3) not null check (multiplier >= 0)
);

insert into public.duration_rates(duration_key, multiplier) values
 ('30',0.6),('60',1),('90',1.4),('120',1.8),('overnight',4.5)
on conflict (duration_key) do nothing;

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instructions text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text not null,
  location text not null,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  therapist_id uuid references public.therapists(id) on delete set null,
  therapist_name text,
  booking_date date not null,
  booking_time time not null,
  duration_key text not null check (duration_key in ('30','60','90','120','overnight')),
  multiplier numeric(8,3) not null,
  total numeric(10,2) not null check (total >= 0),
  deposit_due numeric(10,2) not null check (deposit_due >= 0),
  deposit_paid boolean not null default false,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  payment_method_name text,
  deposit_agreement_accepted boolean not null default false,
  notes text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','cancelled','declined')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_date_time_idx
  on public.bookings(booking_date, booking_time);
create index if not exists bookings_therapist_idx
  on public.bookings(therapist_id, booking_date, booking_time);
create index if not exists bookings_status_idx on public.bookings(status);

alter table public.owner_profiles enable row level security;
alter table public.therapists enable row level security;
alter table public.services enable row level security;
alter table public.duration_rates enable row level security;
alter table public.payment_methods enable row level security;
alter table public.site_settings enable row level security;
alter table public.bookings enable row level security;

create policy "Public can view active therapists"
on public.therapists for select to anon, authenticated using (active = true or public.is_owner());
create policy "Public can view available services"
on public.services for select to anon, authenticated using (available = true or public.is_owner());
create policy "Public can view duration rates"
on public.duration_rates for select to anon, authenticated using (true);
create policy "Public can view enabled payment methods"
on public.payment_methods for select to anon, authenticated using (enabled = true or public.is_owner());

create policy "Owners manage therapists" on public.therapists
for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "Owners manage services" on public.services
for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "Owners manage duration rates" on public.duration_rates
for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "Owners manage payment methods" on public.payment_methods
for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "Owners manage settings" on public.site_settings
for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "Owners read owner profiles" on public.owner_profiles
for select to authenticated using (user_id = auth.uid() or public.is_owner());

create policy "Customers can request bookings"
on public.bookings for insert to anon, authenticated
with check (
  deposit_agreement_accepted = true
  and status = 'pending'
  and deposit_paid = false
  and total >= 0 and deposit_due >= 0
);
create policy "Owners manage bookings"
on public.bookings for all to authenticated
using (public.is_owner()) with check (public.is_owner());
`}</code></pre><Button className="mt-4" onClick={() => { navigator.clipboard?.writeText(document.querySelector("[data-sql-script]")?.innerText || "See SQL script in the Publishing guide."); showNotice("success", "Use the SQL code block above; clipboard copy depends on browser permissions."); }}><Copy size={15}/> Copy SQL note</Button></div>
                <div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" onClick={() => window.open("https://app.netlify.com/", "_blank", "noopener,noreferrer")}><ExternalLink size={15}/> Open Netlify</Button><Button variant="outline" onClick={() => window.open("https://supabase.com/dashboard", "_blank", "noopener,noreferrer")}><ExternalLink size={15}/> Open Supabase</Button><Button variant="light" onClick={resetLocalDemo}><RefreshCw size={15}/> Reset local demo data</Button></div>
              </div>}

              {adminTab === "security" && <div className="max-w-2xl"><div className="mb-6"><h2 className="font-serif text-3xl">Security settings</h2><p className="mt-2 text-sm leading-6 text-stone-500">This panel's password is stored in localStorage on this device.</p></div><div className="rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl">Change local owner password</h3><p className="mt-2 text-sm text-stone-500">Use at least 10 characters.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input className={inputClass} type="password" autoComplete="new-password" value={passwordDraft} onChange={e => setPasswordDraft(e.target.value)} placeholder="New password (10+ characters)"/><Button onClick={saveNewPassword}><Save size={15}/> Update password</Button></div></div><div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl">Emergency reset</h3><p className="mt-2 text-sm leading-6 text-stone-500">Resets the local password to the starter password.</p><Button variant="outline" className="mt-4" onClick={() => setShowResetConfirm(true)}><RefreshCw size={15}/> Reset local password</Button></div><div className="mt-5"><Button variant="light" onClick={() => { setAdminAuthed(false); setPassword(""); }}><LogOut size={15}/> Lock owner panel</Button></div></div>}
            </div></div>}
        </div>
      </div>}
      {showResetConfirm && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/60 p-5"><div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"><h3 className="font-serif text-2xl">Reset local password?</h3><p className="mt-3 text-sm leading-6 text-stone-600">This resets the owner password in this browser to <strong>ChangeMe-123!</strong>.</p><div className="mt-6 flex gap-2"><Button onClick={resetPassword} className="flex-1">Reset password</Button><Button variant="outline" onClick={() => setShowResetConfirm(false)}>Cancel</Button></div></div></div>}
    </div>
  );
}
