import React from "react";
import { 
  Film, 
  Calendar, 
  Zap, 
  DollarSign, 
  ShieldCheck, 
  MapPin, 
  Terminal, 
  Sparkles,
  ExternalLink,
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
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const docsUrl = isLocalhost 
    ? "http://127.0.0.1:8000/docs" 
    : "https://github.com/JashanpreetSingh07/Cinema_Ticket_Demand_Forecasting#4-api-endpoints";

  const tabs = [
    { 
      id: "forecast", 
      label: "Forecaster", 
      tag: "Dual Demand",
      icon: Film 
    },
    { 
      id: "schedule", 
      label: "Master Schedule", 
      tag: "5-Screen Grid",
      icon: Calendar 
    },
    { 
      id: "optimizer", 
      label: "AI Optimizer", 
      tag: "Hall Reallocation",
      icon: Zap 
    },
    { 
      id: "pricing", 
      label: "Pricing Studio", 
      tag: "Elasticity Curve",
      icon: DollarSign 
    },
    { 
      id: "governance", 
      label: "Audit & Models", 
      tag: "19/19 Tests",
      icon: ShieldCheck 
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/98 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/80">
      {/* Top Multi-Color Neon Accent Line */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* TIER 1: Brand & Executive Operations Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 border-b border-white/10">
          
          {/* Brand & Platform Identity */}
          <button 
            onClick={() => setActiveTab("forecast")}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
            title="Return to Single-Show Forecaster"
          >
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 ring-1 ring-white/20 transition-transform group-hover:scale-105">
                <Film className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#070b14] shadow-sm animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white whitespace-nowrap">
                  Cine<span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">Demand</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-extrabold border border-cyan-500/30 tracking-wide uppercase shadow-sm">
                  AI Suite
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span className="text-cyan-400 font-semibold">Algions AI Labs</span>
                <span>•</span>
                <span className="text-slate-300">Multiplex Yield Platform</span>
              </div>
            </div>
          </button>

          {/* Operations Controls (Cinema Selector + Date + Status + Docs) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* Multiplex Location Selector */}
            <div className="flex items-center bg-slate-900/90 border border-white/15 rounded-lg px-2.5 py-1.5 hover:border-cyan-500/50 transition-colors shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 mr-1.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Multiplex</span>
                <select
                  value={selectedCinema}
                  onChange={(e) => setSelectedCinema(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[210px] truncate mt-0.5"
                  title="Select Multiplex Location"
                >
                  {Object.values(CINEMA_CATALOG).map((cin) => (
                    <option key={cin.id} value={cin.id} className="bg-slate-900 text-slate-200">
                      {cin.name} ({cin.totalScreens} Screens)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Operating Date Selector */}
            <div className="flex items-center bg-slate-900/90 border border-white/15 rounded-lg px-2.5 py-1.5 hover:border-cyan-500/50 transition-colors shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 mr-1.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">Schedule Date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer w-[115px] sm:w-[125px] mt-0.5 [color-scheme:dark]"
                  title="Select Operating Date"
                >
                </input>
              </div>
            </div>

            {/* Engine Status Badge */}
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${
                apiOnline
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10"
                  : "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-cyan-500/10"
              }`}
              title={apiOnline ? "FastAPI Inference Microservice Connected (127.0.0.1:8000)" : "Cloud-Calibrated ML Engine Active (Ensemble GBDT + PyTorch TabNet)"}
            >
              <span className={`w-2 h-2 rounded-full ${apiOnline ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-cyan-400 shadow-[0_0_8px_#00f2fe]"}`} />
              <div className="flex flex-col text-left">
                <span className="text-[8px] uppercase tracking-wider opacity-70 leading-none">Inference</span>
                <span className="text-[11px] leading-tight font-extrabold">{apiOnline ? "FastAPI Live" : "Cloud AI Engine"}</span>
              </div>
            </div>

            {/* API Documentation Link */}
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-white/15 text-slate-300 hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all shadow-sm text-xs font-bold"
              title={isLocalhost ? "Open Interactive Swagger UI (localhost:8000/docs)" : "View REST API Schemas & Documentation on GitHub"}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">API Docs</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

          </div>

        </div>

        {/* TIER 2: 100% VISIBLE Segmented Navigation Bar (All 5 Tabs Always Visible) */}
        <div className="py-2 sm:py-2.5">
          <nav 
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 w-full"
            role="tablist"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 text-black border-cyan-300 shadow-lg shadow-cyan-500/30 scale-[1.01] font-black"
                      : "bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-white/25 shadow-sm"
                  }`}
                  title={`${tab.label} — ${tab.tag}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-black stroke-[2.5]" : "text-cyan-400"}`} />
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-xs truncate leading-tight">{tab.label}</span>
                    <span className={`text-[9px] uppercase tracking-wider truncate leading-none mt-0.5 ${isActive ? "text-slate-900 font-bold" : "text-slate-400"}`}>
                      {tab.tag}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

      </div>
    </header>
  );
}
