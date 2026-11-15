import React from "react";
import { 
  Film, 
  Calendar, 
  Zap, 
  DollarSign, 
  ShieldCheck, 
  MapPin, 
  Terminal, 
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
    { id: "forecast", label: "Forecaster", icon: Film, desc: "Single-Show Demand & Seating" },
    { id: "schedule", label: "Master Schedule", icon: Calendar, desc: "Daily 5-Screen Matrix & CSV Export" },
    { id: "optimizer", label: "AI Optimizer", icon: Zap, desc: "Constraint-Aware Hall Reallocation" },
    { id: "pricing", label: "Pricing Studio", icon: DollarSign, desc: "Dynamic Price Elasticity Simulation" },
    { id: "governance", label: "Audit & Models", icon: ShieldCheck, desc: "Held-Out Benchmarks & Feature Pipeline" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50">
      {/* Sleek Gradient Accent Hairline */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        {/* Responsive Multi-Tier Container */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5">
          
          {/* Top Row on Small/Medium Screens: Brand on Left, Controls on Right */}
          <div className="flex items-center justify-between gap-3 w-full xl:w-auto">
            {/* Brand & Logo */}
            <button 
              onClick={() => setActiveTab("forecast")}
              className="flex items-center gap-2.5 text-left group focus:outline-none flex-shrink-0 cursor-pointer"
              title="Return to Single-Show Forecaster"
            >
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
                  <Film className="w-4 h-4 sm:w-5 sm:h-5 text-black stroke-[2.5]" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 border-2 border-[#070b14] shadow-sm animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white whitespace-nowrap">
                    Cine<span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">Demand</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-extrabold border border-cyan-500/30 tracking-wide uppercase shadow-sm">
                    AI Suite
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span className="text-slate-300 font-semibold">Algions AI Labs</span>
                  <span>•</span>
                  <span>Multiplex Yield Engine</span>
                </div>
              </div>
            </button>

            {/* Quick Controls on Mobile/Tablet (< 1280px) */}
            <div className="flex xl:hidden items-center gap-1.5 sm:gap-2">
              {/* Multiplex Selector */}
              <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-lg px-2 py-1 shadow-sm">
                <MapPin className="w-3 h-3 text-cyan-400 mr-1 flex-shrink-0" />
                <select
                  value={selectedCinema}
                  onChange={(e) => setSelectedCinema(Number(e.target.value))}
                  className="bg-transparent text-[11px] font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[150px] truncate"
                  title="Select Multiplex Location"
                >
                  {Object.values(CINEMA_CATALOG).map((cin) => (
                    <option key={cin.id} value={cin.id} className="bg-slate-900 text-slate-200">
                      {cin.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-200 focus:outline-none cursor-pointer w-[110px] sm:w-[120px] [color-scheme:dark]"
                title="Select Operating Date"
              />

              {/* Status Badge */}
              <div 
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
                  apiOnline
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                }`}
                title={apiOnline ? "FastAPI Local Server Connected" : "Cloud AI Engine Active (Client-Side Ensemble)"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? "bg-emerald-400 animate-pulse" : "bg-cyan-400 shadow-[0_0_5px_#00f2fe]"}`} />
                <span>{apiOnline ? "Live" : "Cloud"}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Modern Segmented Controller */}
          <nav 
            className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-inner overflow-x-auto scrollbar-none w-full xl:w-auto justify-start sm:justify-center"
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
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold border border-cyan-400/30 scale-[1.02]"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                  title={tab.desc}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Global Controls on Desktop (xl: 1280px and above) */}
          <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
            {/* Multiplex Selector */}
            <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-lg pl-2 pr-1.5 py-1 hover:border-cyan-500/50 transition-colors shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mr-1.5" />
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[180px] truncate"
                title="Select Multiplex Location"
              >
                {Object.values(CINEMA_CATALOG).map((cin) => (
                  <option key={cin.id} value={cin.id} className="bg-slate-900 text-slate-200">
                    {cin.name} ({cin.totalScreens} Screens)
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-lg px-2 py-1 hover:border-cyan-500/50 transition-colors shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mr-1.5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer w-[120px] [color-scheme:dark]"
                title="Select Operating Date"
              />
            </div>

            {/* Status Badge */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shadow-sm border ${
                apiOnline
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
              }`}
              title={
                apiOnline
                  ? "FastAPI ML Server Connected (127.0.0.1:8000)"
                  : "Cloud-Calibrated AI Engine Active (Zero Latency)"
              }
            >
              <span className={`w-2 h-2 rounded-full ${apiOnline ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-cyan-400 shadow-[0_0_6px_#00f2fe]"}`} />
              <span>{apiOnline ? "API Live" : "Cloud Active"}</span>
            </div>

            {/* Direct API Documentation Quick Action */}
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all flex items-center justify-center shadow-sm"
              title={isLocalhost ? "Open Interactive Swagger UI (localhost:8000/docs)" : "View REST API Documentation & Schemas on GitHub"}
            >
              <Terminal className="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
