"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/providers/auth-provider"
import { useEffect } from "react"
import {
  Calendar, AlertTriangle, Car, Users, Sparkles,
  Bell, Globe, Shield, ArrowRight, CheckCircle, Star,
  Clock, TrendingUp, Zap, BarChart3, MessageSquare,
} from "lucide-react"
import WavyBackground from "@/components/ui/wavy-background"
import { motion } from "framer-motion"

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    desc: "AI-optimised weekly rosters with automatic conflict detection and labour KPI flags.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: AlertTriangle,
    title: "Emergency Response",
    desc: "Instant vacancy alerts broadcast across all branches. First-come-first-serve acceptance.",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Bell,
    title: "Shortage Alerts",
    desc: "Managers broadcast staff shortages. Sudden illness triggers high-priority alerts automatically.",
    color: "from-yellow-500 to-amber-500",
  },
  {
    icon: Sparkles,
    title: "Groq AI Engine",
    desc: "Llama 3.3 70B suggests the best replacement based on skills, proficiency, and availability.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Car,
    title: "Transport Management",
    desc: "Policy-enforced taxi requests. Pickup for emergency shifts, drop-off for late finishes.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Globe,
    title: "Multilingual",
    desc: "Full support for English, Russian, and Lithuanian — switchable before login.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Admin, Manager, and Employee roles with Firestore-enforced security rules.",
    color: "from-slate-500 to-gray-500",
  },
  {
    icon: BarChart3,
    title: "Demand Forecasting",
    desc: "Hourly cover predictions vs historical data with AI-generated staffing insights.",
    color: "from-teal-500 to-cyan-500",
  },
]

const roles = [
  {
    role: "Admin",
    color: "border-red-500/40 bg-red-500/5",
    badge: "bg-red-500/15 text-red-400",
    icon: Shield,
    perks: [
      "Add & manage all employees",
      "Assign roles across branches",
      "Full system settings access",
      "View all alerts & reports",
    ],
  },
  {
    role: "Manager",
    color: "border-blue-500/40 bg-blue-500/5",
    badge: "bg-blue-500/15 text-blue-400",
    icon: Users,
    perks: [
      "Create & optimise schedules",
      "Broadcast shortage alerts",
      "Approve taxi requests",
      "Handle emergency shifts",
    ],
  },
  {
    role: "Employee",
    color: "border-green-500/40 bg-green-500/5",
    badge: "bg-green-500/15 text-green-400",
    icon: Star,
    perks: [
      "View personal schedule",
      "Accept emergency shifts",
      "Report sick leave instantly",
      "Request transport",
    ],
  },
]

const stats = [
  { value: "3x", label: "Faster emergency fill", icon: Zap },
  { value: "100%", label: "Policy-enforced rules", icon: Shield },
  { value: "AI", label: "Powered by Groq LLaMA", icon: Sparkles },
  { value: "3", label: "Languages supported", icon: Globe },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
}

export default function LandingPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // If already logged in, go to dashboard — but only on initial load, not after logout
  useEffect(() => {
    if (!isLoading && user) router.replace("/")
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── Floating Nav ── */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-max">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-4 md:gap-6 bg-slate-900/90 dark:bg-black/70 backdrop-blur-2xl rounded-full px-6 md:px-8 py-3 shadow-2xl border border-white/10 hover:border-white/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg overflow-hidden shadow-lg">
              <Image src="/Logo.jpg" alt="REMO" width={32} height={32} className="object-cover w-full h-full" />
            </div>
            <span className="text-sm md:text-base font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">REMO</span>
          </div>
          
          <div className="hidden sm:block w-px h-6 bg-white/10" />
          
          <div className="flex items-center gap-2 md:gap-3">
            <motion.button
              onClick={() => router.push("/?login")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs md:text-sm text-slate-300 hover:text-white transition-colors px-3 md:px-4 py-2 rounded-full hover:bg-white/5"
            >
              Sign In
            </motion.button>
          </div>
        </motion.div>
      </nav>

      {/* ── Hero ── */}
      <WavyBackground className="min-h-screen">
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-8">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-600/15 rounded-full blur-[80px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-600/15 rounded-full blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Groq · LLaMA 3.3 70B
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Restaurant Management
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Reimagined with AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            REMO automates scheduling, handles emergencies instantly, coordinates transport,
            and broadcasts shortage alerts across all your branches — in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/?login")}
              className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors bg-white/5"
            >
              Sign In
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500">
            {["Firebase Auth", "Firestore", "Groq AI", "Real-time Alerts", "Multi-branch"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" /> {t}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Dashboard preview card */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 mt-20 w-full max-w-5xl mx-auto"
        >
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/50">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <div className="flex-1 bg-slate-800 rounded-full h-6 ml-2 flex items-center px-3">
                <span className="text-xs text-slate-500">remo.app/dashboard</span>
              </div>
            </div>
            {/* Mock dashboard grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Active Staff", value: "12", color: "text-blue-400" },
                { label: "Open Alerts", value: "3", color: "text-red-400" },
                { label: "Covers Today", value: "790", color: "text-green-400" },
                { label: "Pending Taxi", value: "2", color: "text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="col-span-2 bg-slate-800/60 rounded-xl p-4 border border-white/5 h-28 flex items-center justify-center">
                <div className="flex items-end gap-1 h-16">
                  {[40, 70, 55, 90, 65, 100, 80, 45, 75, 60, 85, 50].map((h, i) => (
                    <div key={i} className="w-3 rounded-sm bg-gradient-to-t from-blue-600 to-purple-500 opacity-80"
                      style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-4 border border-white/5 h-28 space-y-2">
                {["Sarah — Meat ✓", "Tom — Grill ✓", "Anna — Bar ⏳"].map((s) => (
                  <div key={s} className="text-xs text-slate-400 bg-slate-700/50 rounded-lg px-2 py-1">{s}</div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>
      </WavyBackground>

      {/* ── Stats ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
              className="text-center">
              <s.icon className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Everything you need</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">One platform for scheduling, emergencies, transport, and AI-powered staffing decisions.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors group">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Built for every role</h2>
            <p className="text-slate-400 text-lg">Each user sees exactly what they need — nothing more, nothing less.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((r, i) => (
              <motion.div key={r.role} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                className={`border rounded-2xl p-6 ${r.color}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <r.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${r.badge}`}>{r.role}</span>
                </div>
                <ul className="space-y-2.5">
                  {r.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">How it works</h2>
          </div>
          <div className="space-y-6">
            {[
              { step: "01", title: "Manager spots a shortage", desc: "A staff member calls in sick. Manager opens REMO and creates a shortage alert in seconds.", icon: MessageSquare },
              { step: "02", title: "AI finds the best match", desc: "Groq analyses all employees' skills and proficiency levels, then recommends the ideal replacement.", icon: Sparkles },
              { step: "03", title: "Alert broadcasts instantly", desc: "All eligible employees across every branch receive the alert. First to accept gets the shift.", icon: Bell },
              { step: "04", title: "Transport arranged automatically", desc: "If the shift is an emergency pickup or a late drop-off, the employee requests a taxi — manager approves in one tap.", icon: Car },
            ].map((s, i) => (
              <motion.div key={s.step} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                className="flex gap-5 items-start bg-slate-900 border border-white/5 rounded-2xl p-5">
                <div className="text-3xl font-extrabold text-white/10 w-12 shrink-0">{s.step}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className="h-4 w-4 text-blue-400" />
                    <h3 className="font-bold">{s.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[100px]" />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5">
            Ready to run a smarter restaurant?
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Sign up free. No credit card required. Your first admin account is set up automatically.
          </p>
          <button
            onClick={() => router.push("/?login")}
            className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-10 py-4 rounded-2xl text-lg transition-colors"
          >
            Sign In <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl overflow-hidden">
              <Image src="/Logo.jpg" alt="REMO" width={32} height={32} className="object-cover w-full h-full" />
            </div>
            <span className="font-bold text-white">REMO</span>
            <span className="text-slate-600 text-sm">Smart Restaurant Management</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Real-time</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Secure</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> AI-powered</span>
          </div>
          <p className="text-slate-600 text-sm">© {new Date().getFullYear()} REMO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
