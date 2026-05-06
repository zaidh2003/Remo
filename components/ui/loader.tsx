"use client"

import Image from "next/image"

export function SiteLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950">
      {/* Glow backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Logo + pulse ring */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer pulse ring */}
        <span className="absolute inline-flex h-28 w-28 rounded-full bg-blue-500/20 animate-ping" />
        {/* Inner ring */}
        <span className="absolute inline-flex h-20 w-20 rounded-full bg-blue-500/10" />
        {/* Logo */}
        <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/30 border border-white/10">
          <Image
            src="/Logo.jpg"
            alt="REMO"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Brand name */}
      <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1 tracking-tight">
        REMO
      </h1>
      <p className="text-xs text-slate-500 uppercase tracking-[0.3em] font-semibold mb-8">
        Smart Management
      </p>

      {/* Progress bar */}
      <div className="w-48 h-0.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes loading {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 70%;  margin-left: 15%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
