"use client"

import { useState } from "react"
import { ChefHat, Mail, Lock, Eye, EyeOff, Loader, Globe, User, Phone, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import WavyBackground from "@/components/ui/wavy-background"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { createUserProfileIfNeeded } from "@/lib/services/user-service"

type Language = "en" | "ru" | "lt"

const translations = {
  en: {
    welcome: "Welcome to",
    description: "The all-in-one smart restaurant management system. Automate scheduling, handle emergencies instantly, and coordinate transport across branches.",
    learnMore: "Learn More",
    signIn: "Sign In", signUp: "Sign Up",
    accessDash: "Access your dashboard",
    fullName: "Full Name", email: "Email Address", password: "Password",
    phone: "Phone Number", position: "Job Position",
    remember: "Remember me", forgot: "Forgot password?",
    signingIn: "Signing in...", signingUp: "Signing up...",
    continueWith: "Or continue with",
    noAccount: "Don't have an account?", haveAccount: "Already have an account?",
  },
  ru: {
    welcome: "Добро пожаловать в",
    description: "Умная система управления рестораном «все в одном».",
    learnMore: "Узнать больше",
    signIn: "Войти", signUp: "Регистрация",
    accessDash: "Доступ к панели управления",
    fullName: "Полное имя", email: "Электронная почта", password: "Пароль",
    phone: "Номер телефона", position: "Должность",
    remember: "Запомнить меня", forgot: "Забыли пароль?",
    signingIn: "Вход...", signingUp: "Регистрация...",
    continueWith: "Или продолжите через",
    noAccount: "Нет аккаунта?", haveAccount: "Уже есть аккаунт?",
  },
  lt: {
    welcome: "Sveiki atvykę į",
    description: "Ismani restoranu valdymo sistema 'viskas viename'.",
    learnMore: "Suzinoti daugiau",
    signIn: "Prisijungti", signUp: "Registruotis",
    accessDash: "Prieiga prie valdymo skydelio",
    fullName: "Vardas Pavardė", email: "El. pašto adresas", password: "Slaptažodis",
    phone: "Telefono numeris", position: "Pareigos",
    remember: "Prisiminti mane", forgot: "Pamiršote slaptažodį?",
    signingIn: "Prisijungiama...", signingUp: "Registruojamasi...",
    continueWith: "Arba tęskite su",
    noAccount: "Neturite paskyros?", haveAccount: "Jau turite paskyrą?",
  },
}

export function LoginPage() {
  const [lang, setLang] = useState<Language>("en")
  const t = translations[lang]

  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone]       = useState("")
  const [position, setPosition] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const resetSignupFields = () => { setFullName(""); setPhone(""); setPosition("") }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }
    if (!isLoginMode && !fullName.trim()) {
      setError("Please enter your full name")
      setIsLoading(false)
      return
    }

    try {
      if (isLoginMode) {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        await createUserProfileIfNeeded(cred.user.uid, cred.user.email, cred.user.displayName)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await createUserProfileIfNeeded(
          cred.user.uid, cred.user.email, fullName.trim(), "EMPLOYEE",
          { phone: phone.trim(), position: position.trim() }
        )
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      await createUserProfileIfNeeded(cred.user.uid, cred.user.email, cred.user.displayName)
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.")
    }
  }

  const switchMode = () => { setIsLoginMode(!isLoginMode); setError(""); resetSignupFields() }

  return (
    <WavyBackground className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Globe className="h-4 w-4 text-white/70" />
        <select
          className="bg-black/30 text-white border border-white/20 rounded-lg px-2 py-1 text-sm backdrop-blur-sm outline-none"
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
        >
          <option className="text-black" value="en">EN</option>
          <option className="text-black" value="ru">RU</option>
          <option className="text-black" value="lt">LT</option>
        </select>
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between px-6 lg:px-12 py-12 gap-16 lg:gap-32 z-10 min-h-screen">
        {/* Left — branding */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl p-8 rounded-3xl bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/30 mb-6">
            <ChefHat className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            {t.welcome}{" "}
            <span className="bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">REMO</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-md drop-shadow-md">{t.description}</p>
          <Button variant="outline" className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 px-6 py-6 text-base shadow-xl backdrop-blur-sm">
            {t.learnMore}
          </Button>
        </div>

        {/* Right — auth card */}
        <div className="w-full max-w-md z-10">
          <div className="bg-card/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/30 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center mb-6 relative z-10">
              <h2 className="text-3xl font-bold text-foreground">{isLoginMode ? t.signIn : t.signUp}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t.accessDash}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
              {/* ── Sign-up only fields ── */}
              {!isLoginMode && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">{t.fullName}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full bg-sidebar border border-border rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-primary transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">{t.phone}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 555 0100"
                          className="w-full bg-sidebar border border-border rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-primary transition-colors text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">{t.position}</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="Head Chef"
                          className="w-full bg-sidebar border border-border rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-primary transition-colors text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">{t.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@restaurant.com"
                    className="w-full bg-sidebar border border-border rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">{t.password}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-sidebar border border-border rounded-lg pl-9 pr-10 py-2.5 outline-none focus:border-primary transition-colors text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword
                      ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                      : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Remember / Forgot — login only */}
              {isLoginMode && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-muted-foreground">{t.remember}</span>
                  </label>
                  <a href="#" className="text-sm text-primary hover:underline">{t.forgot}</a>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 mt-1"
              >
                {isLoading
                  ? <><Loader className="h-4 w-4 animate-spin" />{isLoginMode ? t.signingIn : t.signingUp}</>
                  : isLoginMode ? t.signIn : t.signUp}
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">{t.continueWith}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full border-border bg-white text-black hover:bg-slate-100 hover:text-black py-2.5 flex items-center justify-center gap-2 font-medium"
              >
                <svg className="h-5 w-5" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                </svg>
                Google
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5 relative z-10">
              {isLoginMode ? t.noAccount : t.haveAccount}{" "}
              <button onClick={switchMode} className="text-primary hover:text-primary/80 font-semibold transition-colors">
                {isLoginMode ? t.signUp : t.signIn}
              </button>
            </p>
          </div>
        </div>
      </div>
    </WavyBackground>
  )
}
