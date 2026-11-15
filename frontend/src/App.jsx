import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import DemandForecaster from "./components/DemandForecaster";
import MasterSchedule from "./components/MasterSchedule";
import ScheduleOptimizer from "./components/ScheduleOptimizer";
import PriceElasticity from "./components/PriceElasticity";
import Governance from "./components/Governance";
import { CINEMA_CATALOG } from "./data/mockCatalog";
import { Film, Activity, Sparkles, CheckCircle2, ShieldCheck, Terminal } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [selectedCinema, setSelectedCinema] = useState(304); // Grand Metropolis 16
  const [selectedDate, setSelectedDate] = useState("2024-11-22");
  const [apiOnline, setApiOnline] = useState(false);

  // Poll backend health (only when running on localhost to avoid HTTPS mixed-content warnings)
  useEffect(() => {
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (!isLocalhost) {
      setApiOnline(false);
      return;
    }

    const checkHealth = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/health", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setApiOnline(data.status === "healthy");
        } else {
          setApiOnline(false);
        }
      } catch (e) {
        setApiOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCinema={selectedCinema}
        setSelectedCinema={setSelectedCinema}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        apiOnline={apiOnline}
      />

      {/* Main Content Area - Generous, balanced container fitting seamlessly across laptops & desktop monitors */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {activeTab === "forecast" && (
          <DemandForecaster
            selectedCinema={selectedCinema}
            selectedDate={selectedDate}
            onNavigateToOptimizer={() => setActiveTab("optimizer")}
          />
        )}

        {activeTab === "schedule" && (
          <MasterSchedule
            selectedCinema={selectedCinema}
            selectedDate={selectedDate}
            onNavigateToOptimizer={() => setActiveTab("optimizer")}
          />
        )}

        {activeTab === "optimizer" && (
          <ScheduleOptimizer
            selectedCinema={selectedCinema}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === "pricing" && (
          <PriceElasticity />
        )}

        {activeTab === "governance" && (
          <Governance />
        )}
      </main>

      {/* Enterprise Platform Footer */}
      <footer className="border-t border-dark-800/80 bg-dark-900/60 backdrop-blur-md py-5 mt-12 text-xs text-gray-500">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-black text-[10px] shadow-sm">
              &Delta;
            </div>
            <div>
              <span className="font-semibold text-gray-300">CineDemand AI</span> &bull; Production Cinema Ticket Demand Forecasting System
            </div>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-400 transition-colors flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              FastAPI Swagger Docs
            </a>
            <span className="text-gray-700">&bull;</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              T-3 Leak-Free Certified
            </span>
            <span className="text-gray-700">&bull;</span>
            <span>Algions AI Labs Assessment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
