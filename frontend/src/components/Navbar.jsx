import React from "react";
import { 
  Film, 
  Calendar, 
  Zap, 
  DollarSign, 
  ShieldCheck, 
  Activity, 
  MapPin, 
  ExternalLink, 
  Terminal, 
  Sparkles,
  ChevronDown
} from "lucide-react";
import { CINEMA_CATALOG } from "../data/mockCatalog";

export default function Navbar({
  activeTab,
  setActiveTab,
  selectedCinema,
  setSelectedCinema,
  selectedDate,
  setSelectedDate,
  apiOnline,
}) {
  const currentCinema = CINEMA_CATALOG[selectedCinema] || Object.values(CINEMA_CATALOG)[0];

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50">
      {/* Sleek Gradient Accent Hairline */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab("forecast")}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
                <Film className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#070b14] shadow-sm animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white whitespace-nowrap">
                  Cine<span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">Demand</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-extrabold border border-cyan-500/30 tracking-wide uppercase shadow-sm">
                  AI Suite
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <span className="text-slate-300 font-semibold">Algions AI Labs</span>
                <span>•</span>
                <span>Multiplex Yield Engine</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Modern Segmented Controller */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-inner overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("forecast")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "forecast"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold border border-cyan-400/30 scale-[1.02]"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title="Demand Forecast & Dual-Hall Seating"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Forecaster</span>
            </button>

            <button
              onClick={() => setActiveTab("schedule")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "schedule"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold border border-cyan-400/30 scale-[1.02]"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title="Full Daily Multiplex Screening Timetable"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Master Schedule</span>
            </button>

            <button
              onClick={() => setActiveTab("optimizer")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "optimizer"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold border border-cyan-400/30 scale-[1.02]"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title="Constraint-Optimized Screen Allocations"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>AI Optimizer</span>
            </button>

            <button
              onClick={() => setActiveTab("pricing")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "pricing"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold border border-cyan-400/30 scale-[1.02]"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title="Continuous Dynamic Price Elasticity Curve"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Pricing Studio</span>
            </button>

            <button
              onClick={() => setActiveTab("governance")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "governance"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold border border-cyan-400/30 scale-[1.02]"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
              title="Feature Pipeline Audit & Model Evaluation Benchmarks"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit & Models</span>
            </button>
          </nav>

          {/* Global Controls & Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Multiplex Selector with MapPin Icon */}
            <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-lg pl-2 pr-1 py-1 hover:border-cyan-500/50 transition-colors shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mr-1.5" />
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
                title="Select Multiplex Location"
              >
                {Object.values(CINEMA_CATALOG).map((cin) => (
                  <option key={cin.id} value={cin.id} className="bg-slate-900 text-slate-200">
                    {cin.name} ({cin.totalScreens} Screens)
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker with Calendar Icon */}
            <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-lg px-2 py-1 hover:border-cyan-500/50 transition-colors shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mr-1.5 hidden sm:inline-block" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer w-[115px] sm:w-[125px]"
                title="Select Operating Date"
              />
            </div>

            {/* Live API Health Status Badge */}
            {apiOnline ? (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold whitespace-nowrap shadow-sm shadow-emerald-500/10"
                title="FastAPI Inference Engine Online (127.0.0.1:8000)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
                <span className="hidden md:inline">API Live</span>
              </div>
            ) : (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold whitespace-nowrap shadow-sm"
                title="Local ML Engine Inference Active"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f2fe]" />
                <span className="hidden md:inline">Engine Active</span>
              </div>
            )}

            {/* Direct Swagger API Docs Quick Action */}
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all flex items-center justify-center shadow-sm"
              title="Open Interactive FastAPI Swagger Documentation"
            >
              <Terminal className="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
