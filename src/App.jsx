import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Clock3, MapPin, Phone, Mail, UserRound, Sparkles,
  ShieldCheck, LockKeyhole, Eye, EyeOff, Settings2, Users, Wallet,
  ClipboardList, Plus, Pencil, Trash2, Check, X, ChevronRight, Menu,
  LogOut, CircleDollarSign, Database, ExternalLink, Copy, RefreshCw,
  Heart, Waves, Flame, Leaf, BadgeCheck, AlertCircle, CheckCircle2,
  Search, SlidersHorizontal, Info, Moon, Sun, ArrowLeft, Save
} from "lucide-react";

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
    showNotice("success", "Local password reset to the starter password.");
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
    if (!window.confirm("Reset all local demo data on this device?")) return;
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
            <div><p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[.2em] text-amber-100"><Sparkles size={13}/> Thoughtful care, tailored to you</p><h1 className="max-w-3xl font-serif text-5xl leading-[1.06] sm:text-6xl lg:text-7xl">WELCOME TO A <span className="italic text-[#d7c29a]">PERSONALIZED</span> EXPERIENCE</h1><p className="mt-7 max-w-xl text-base leading-7 text-stone-200 sm:text-lg">Make room to slow down. Explore considered treatments, choose your preferred therapist, and request a session designed around your comfort.</p><div className="mt-9 flex flex-wrap gap-3"><a href="#booking" className="inline-flex items-center gap-2 rounded-full bg-[#d7c29a] px-6 py-4 text-sm font-bold text-emerald-950 hover:bg-amber-100">Book your moment <ChevronRight size={17}/></a><a href="#services" className="inline-flex items-center rounded-full border border-white/30 px-6 py-4 text-sm font-semibold text-white hover:bg-white/10">Explore treatments</a></div></div>
            <div className="relative mx-auto w-full max-w-lg"><div className="absolute -inset-4 rounded-[2rem] border border-white/10 rotate-3"/><div className="relative overflow-hidden rounded-[1.7rem] bg-[#e5dfd1] p-3"><div className="flex min-h-[390px] flex-col justify-between rounded-[1.2rem] bg-gradient-to-br from-[#b8c4b3] via-[#e9dfca] to-[#a8b7a8] p-7 text-emerald-950 sm:min-h-[480px] sm:p-10"><div className="flex justify-between"><span className="rounded-full bg-white/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em]">A softer pace</span><Sparkles size={22}/></div><div><div className="mb-5 h-px w-16 bg-emerald-900/50"/><p className="font-serif text-4xl leading-tight sm:text-5xl">Rest is not a reward.<br/><span className="italic">It's part of you.</span></p><p className="mt-5 max-w-xs text-sm leading-6 text-emerald-950/75">Personalized sessions in a calm, welcoming setting.</p></div><div className="flex items-end justify-between"><span className="text-[10px] uppercase tracking-[.2em]">Still & Bloom Studio</span><div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-950/30"><Leaf size={26}/></div></div></div></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24" id="services">
          <SectionTitle eyebrow="The treatment menu" title="Care that meets you where you are." description="Choose a session that suits your needs. Prices update automatically when you select a duration in the booking form."/>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.services.map(s => <article key={s.id} className={`group rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-200/50 ${!s.available ? "opacity-60" : ""}`}><div className="mb-6 flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf1e9] text-emerald-900"><IconFor type={s.icon} size={23}/></span><span className="rounded-full bg-stone-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-600">{s.tag || "Personalized"}</span></div><h3 className="font-serif text-xl text-stone-900">{s.name}</h3><p className="mt-3 min-h-[48px] text-sm leading-6 text-stone-600">{s.description}</p><div className="mt-6 flex items-end justify-between border-t border-stone-100 pt-5"><div><span className="text-xs text-stone-500">Starting at</span><p className="font-serif text-2xl">{money(s.price)}</p></div>{s.available ? <button onClick={() => { setSelectedService(s.id); document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" }); }} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-900">Select <ChevronRight size={16}/></button> : <span className="text-xs font-semibold text-stone-500">Currently unavailable</span>}</div></article>)}</div>
        </section>

        <section id="therapists" className="border-y border-stone-200 bg-[#f2f0e9]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><SectionTitle eyebrow="The people behind the care" title="Meet your therapist." description="Choose an active therapist for your appointment request."/><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.therapists.filter(t => t.active).map((t, i) => <div key={t.id} className="flex gap-5 rounded-2xl bg-white p-5 shadow-sm"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dfe7db] text-emerald-900">{t.avatar ? <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }}/> : <UserRound size={30}/>}</div><div className="pt-1"><div className="flex items-center gap-2"><h3 className="font-serif text-xl">{t.name}</h3><BadgeCheck size={15} className="text-emerald-800"/></div><p className="mt-2 text-sm leading-6 text-stone-600">{t.bio || "Focused on your comfort and preferences."}</p><span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[.16em] text-emerald-800">Accepting requests</span></div></div>)}</div></div></section>

        <section id="booking" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div className="lg:sticky lg:top-28 lg:self-start"><SectionTitle eyebrow="Your time, your way" title="Request your appointment." description="Complete the details below."/><div className="rounded-2xl bg-[#172c25] p-6 text-white"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><LockKeyhole size={19}/></span><div><h3 className="font-semibold">A clear deposit policy</h3><p className="mt-1 text-xs text-stone-300">Simple, upfront pricing</p></div></div><p className="mt-4 text-sm leading-6 text-stone-300">{data.checkoutInstructions}</p></div></div>
            <form onSubmit={submitBooking} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">01 / Your details</p><h3 className="mt-2 font-serif text-2xl">Let's get to know you</h3></div><span className="rounded-full bg-stone-100 px-3 py-2 text-xs text-stone-500">Required fields *</span></div>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Full name *"><input className={inputClass} required value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="Your full name"/></Field><Field label="Phone number *"><input className={inputClass} required type="tel" value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="+1 555 000 0000"/></Field><Field label="Email address *"><input className={inputClass} required type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="you@example.com"/></Field><Field label="Session location / address *"><input className={inputClass} required value={form.location} onChange={e => updateForm("location", e.target.value)} placeholder="Address or preferred location"/></Field></div>
              <div className="mb-7 mt-9 border-t border-stone-100 pt-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">02 / Your treatment</p><h3 className="mt-2 font-serif text-2xl">Build your session</h3></div>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Service *"><select className={inputClass} value={selectedService} onChange={e => setSelectedService(e.target.value)} required>{activeServices.map(s => <option key={s.id} value={s.id}>{s.name} — {money(s.price)} base</option>)}</select></Field><Field label="Duration *"><select className={inputClass} value={duration} onChange={e => setDuration(e.target.value)}>{Object.keys(durationSeed).map(d => <option key={d} value={d}>{d === "overnight" ? "Overnight" : `${d} minutes`}</option>)}</select></Field><Field label="Date *"><input className={inputClass} type="date" min={minDate} required value={form.date} onChange={e => updateForm("date", e.target.value)}/></Field><Field label="Start time *"><input className={inputClass} type="time" required value={form.time} onChange={e => updateForm("time", e.target.value)}/></Field><Field label="Preferred therapist *"><select className={inputClass} required value={form.therapistId} onChange={e => updateForm("therapistId", e.target.value)}><option value="">Choose a therapist</option>{data.therapists.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field><Field label="Payment method *"><select className={inputClass} required value={form.paymentId} onChange={e => updateForm("paymentId", e.target.value)}>{activePayments.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field></div>
              <div className="mt-5"><Field label="Preferences or accessibility notes"><textarea className={`${inputClass} min-h-[90px] resize-y`} value={form.notes} onChange={e => updateForm("notes", e.target.value)} placeholder="Anything you'd like your therapist to know?"/></Field></div>
              <div className="mt-6 rounded-2xl bg-[#f4f5ef] p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Your estimate</p></div><CircleDollarSign size={23} className="text-emerald-900"/></div><div className="space-y-3 text-sm"><div className="flex justify-between font-semibold"><span>Estimated total</span><span>{money(total)}</span></div><div className="flex justify-between text-emerald-900 font-bold"><span>50% deposit to request booking</span><span>{money(deposit)}</span></div></div></div>
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-4"><input className="mt-1 h-4 w-4 accent-emerald-900" type="checkbox" required checked={form.depositAccepted} onChange={e => updateForm("depositAccepted", e.target.checked)}/><span className="text-sm leading-6 text-stone-700"><strong>50% Deposit Agreement *</strong><br/>I understand that a 50% deposit is required to secure my appointment.</span></label>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button type="submit" className="flex-1 py-4">Request appointment <ChevronRight size={17}/></Button></div>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-[#172c25] text-white"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><p className="font-serif text-2xl">Still & Bloom</p></div><button onClick={() => { setAdminOpen(true); setAdminAuthed(false); }} className="inline-flex items-center gap-2 text-stone-300 hover:text-white"><Settings2 size={14}/> Owner access</button></div></footer>

      {notice && <div role="status" className={`fixed bottom-5 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-2xl px-5 py-4 shadow-2xl ${notice.type === "error" ? "bg-red-950 text-white" : "bg-emerald-950 text-white"}`}><p className="flex-1 text-sm">{notice.text}</p><button onClick={() => setNotice(null)}><X size={17}/></button></div>}

      {adminOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/60 p-5 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
          {!adminAuthed ? <form onSubmit={authenticate}><h2 className="font-serif text-2xl mb-4">Owner sign in</h2><Field label="Password"><input className={inputClass} type="password" value={password} onChange={e => setPassword(e.target.value)} required/></Field><Button type="submit" className="mt-4 w-full">Unlock</Button><button type="button" className="mt-3 w-full text-xs text-stone-500 underline" onClick={closeAdmin}>Cancel</button></form> :
          <div><h2 className="font-serif text-2xl mb-4">Owner panel</h2><p className="text-sm text-stone-600 mb-4">Total Bookings: {data.bookings.length}</p><Button variant="outline" className="w-full mb-3" onClick={() => setAdminAuthed(false)}>Lock panel</Button><Button variant="light" className="w-full" onClick={closeAdmin}>Close</Button></div>}
        </div>
      </div>}
    </div>
  );
}
