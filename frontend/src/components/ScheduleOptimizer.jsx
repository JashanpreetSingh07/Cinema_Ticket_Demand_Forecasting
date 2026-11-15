import React, { useState } from "react";
import { FILM_CATALOG, CINEMA_CATALOG, POSTER_FALLBACK } from "../data/mockCatalog";
import { 
  Sparkles, ArrowRightLeft, TrendingUp, CheckCircle, 
  DollarSign, RefreshCw, AlertCircle, Award, Layers 
} from "lucide-react";

export default function ScheduleOptimizer({ selectedCinema, selectedDate }) {
  const [selectedSlot, setSelectedSlot] = useState(3); // Prime 19:15
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const currentCinema = CINEMA_CATALOG[selectedCinema] || Object.values(CINEMA_CATALOG)[0];

  // Baseline allocation before optimization (intentional misallocation for demonstration)
  // Screen 1 (IMAX 360) is running Oppenheimer (demand 160 -> empty seats)
  // Screen 3 (Standard 140) is running Dune 2 (demand 380 -> heavy turnaways)
  const [baselineShows, setBaselineShows] = useState([
    {
      screen_id: 1,
      screen_name: "Screen 1 - IMAX Grand Theater",
      capacity: 360,
      film_id: 1480, // Oppenheimer
      unconstrained_demand: 180,
    },
    {
      screen_id: 2,
      screen_name: "Screen 2 - Dolby Atmos Premier",
      capacity: 250,
      film_id: 1481, // Spider-Man
      unconstrained_demand: 220,
    },
    {
      screen_id: 3,
      screen_name: "Screen 3 - Classic Cinema Hall A",
      capacity: 140,
      film_id: 1492, // Dune 2 (Massive demand in small hall)
      unconstrained_demand: 380,
    },
    {
      screen_id: 4,
      screen_name: "Screen 4 - Classic Cinema Hall B",
      capacity: 100,
      film_id: 1571, // Deadpool
      unconstrained_demand: 190,
    },
    {
      screen_id: 5,
      screen_name: "Screen 5 - VIP Recliner Suite",
      capacity: 70,
      film_id: 1486, // John Wick
      unconstrained_demand: 65,
    },
  ]);

  // Optimal allocation: Sort films by demand descending and screens by capacity descending
  const runOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setIsApplied(false);
    }, 600);
  };

  // Calculate baseline metrics
  const baselineStats = baselineShows.reduce(
    (acc, show) => {
      const admitted = Math.min(show.capacity, show.unconstrained_demand);
      const spillover = Math.max(0, show.unconstrained_demand - show.capacity);
      const film = FILM_CATALOG[show.film_id];
      const rev = admitted * (film ? film.base_price : 15);
      return {
        admitted: acc.admitted + admitted,
        spillover: acc.spillover + spillover,
        revenue: acc.revenue + rev,
        totalCapacity: acc.totalCapacity + show.capacity,
      };
    },
    { admitted: 0, spillover: 0, revenue: 0, totalCapacity: 0 }
  );

  // Compute optimal assignment (Hungarian / Greedy Match)
  // 1. Sort films by unconstrained demand desc
  // 2. Sort screens by capacity desc
  const sortedFilms = [...baselineShows].sort((a, b) => b.unconstrained_demand - a.unconstrained_demand);
  const sortedScreens = [...baselineShows].sort((a, b) => b.capacity - a.capacity);

  const optimalShows = sortedScreens.map((screen, idx) => {
    const filmShow = sortedFilms[idx];
    return {
      screen_id: screen.screen_id,
      screen_name: screen.screen_name,
      capacity: screen.capacity,
      film_id: filmShow.film_id,
      unconstrained_demand: filmShow.unconstrained_demand,
      previous_screen_id: filmShow.screen_id,
    };
  });

  const optimalStats = optimalShows.reduce(
    (acc, show) => {
      const admitted = Math.min(show.capacity, show.unconstrained_demand);
      const spillover = Math.max(0, show.unconstrained_demand - show.capacity);
      const film = FILM_CATALOG[show.film_id];
      const rev = admitted * (film ? film.base_price : 15);
      return {
        admitted: acc.admitted + admitted,
        spillover: acc.spillover + spillover,
        revenue: acc.revenue + rev,
      };
    },
    { admitted: 0, spillover: 0, revenue: 0 }
  );

  const incrementalTickets = optimalStats.admitted - baselineStats.admitted;
  const incrementalRevenue = optimalStats.revenue - baselineStats.revenue;
  const turnawayReductionPct = Math.round(
    ((baselineStats.spillover - optimalStats.spillover) / (baselineStats.spillover || 1)) * 100
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="card-glass p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-brand-500/20 to-purple-500/20 text-brand-300 text-xs font-semibold rounded-full border border-brand-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Greedy Capacity Matching Engine
              </span>
              <span className="text-xs text-gray-400">
                Slot: Prime 19:15 PM &bull; {selectedDate}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-2">
              1-Click AI Auditorium Reallocation Optimizer
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl mt-1">
              Eliminate revenue loss from hall mismatches. The AI solves the bottleneck assignment problem by moving high-demand blockbusters into large-capacity halls, instantly recovering turnaway tickets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runOptimization}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-brand-500/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isOptimizing ? "animate-spin" : ""}`} />
              Re-Calculate Optimal Match
            </button>
          </div>
        </div>

        {/* Impact Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-dark-700/80">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Additional Tickets Admitted
            </div>
            <div className="text-3xl font-bold text-white mt-1">
              +{incrementalTickets}{" "}
              <span className="text-xs font-normal text-emerald-300">patrons</span>
            </div>
            <div className="text-xs text-emerald-400 mt-1">
              Occupancy jump from {Math.round((baselineStats.admitted / baselineStats.totalCapacity) * 100)}% to{" "}
              {Math.round((optimalStats.admitted / baselineStats.totalCapacity) * 100)}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30">
            <div className="text-xs font-medium text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Incremental Box Office Rev
            </div>
            <div className="text-3xl font-bold text-brand-300 mt-1">
              +${incrementalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-brand-400 mt-1">Single evening screening boost</div>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <div className="text-xs font-medium text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Turnaway Reduction
            </div>
            <div className="text-3xl font-bold text-purple-300 mt-1">
              -{turnawayReductionPct}%
            </div>
            <div className="text-xs text-purple-400 mt-1">
              Turnaways dropped from {baselineStats.spillover} to {optimalStats.spillover}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-700/60 flex flex-col justify-between">
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                System Status
              </div>
              <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Hungarian Optimizer Ready
              </div>
            </div>
            <button
              onClick={() => setIsApplied(true)}
              disabled={isApplied}
              className={`mt-2 py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
                isApplied
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                  : "bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20"
              }`}
            >
              {isApplied ? "Published to POS & Displays" : "Apply & Publish to POS"}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Sub-Optimal Allocation */}
        <div className="card-glass p-6 rounded-2xl border border-dark-700/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Current Allocation (Bottlenecked)
              </span>
              <h2 className="text-lg font-bold text-white mt-2">
                Unoptimized Multi-Hall Assignment
              </h2>
            </div>
            <span className="text-xs text-gray-400">
              Turnaway Loss: <span className="text-rose-400 font-bold">{baselineStats.spillover} seats</span>
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {baselineShows.map((show) => {
              const film = FILM_CATALOG[show.film_id];
              const admitted = Math.min(show.capacity, show.unconstrained_demand);
              const spillover = Math.max(0, show.unconstrained_demand - show.capacity);
              const isBottleneck = spillover > 0;

              return (
                <div
                  key={show.screen_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isBottleneck
                      ? "bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50"
                      : "bg-dark-900/60 border-dark-700/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={film.poster || POSTER_FALLBACK}
                        alt={film.title}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = POSTER_FALLBACK; }}
                        className="w-10 h-14 object-cover rounded shadow"
                      />
                      <div>
                        <div className="text-sm font-bold text-white">{film.title}</div>
                        <div className="text-xs text-gray-400">
                          {show.screen_name.split("-")[0].trim()} ({show.capacity} seats)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-400">Demand vs Hall</div>
                      <div className="text-sm font-bold text-white">
                        {show.unconstrained_demand}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          / {show.capacity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-dark-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Admitted:</span>
                      <span className="font-semibold text-emerald-400">{admitted}</span>
                    </div>

                    {isBottleneck ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Turnaway: {spillover} patrons
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        Empty Seats: {show.capacity - admitted}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Optimized Allocation */}
        <div className="card-glass p-6 rounded-2xl border border-brand-500/30 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-brand-500/20 text-brand-300 border border-brand-500/40 flex items-center gap-1 w-max">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                AI Optimal Reallocation
              </span>
              <h2 className="text-lg font-bold text-white mt-2">
                Maximizing Admitted Patrons
              </h2>
            </div>
            <span className="text-xs text-gray-400">
              Recovered: <span className="text-emerald-400 font-bold">+{incrementalTickets} seats</span>
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {optimalShows.map((show) => {
              const film = FILM_CATALOG[show.film_id];
              const admitted = Math.min(show.capacity, show.unconstrained_demand);
              const spillover = Math.max(0, show.unconstrained_demand - show.capacity);
              const wasSwapped = show.screen_id !== show.previous_screen_id;

              return (
                <div
                  key={show.screen_id}
                  className={`p-4 rounded-xl border transition-all ${
                    wasSwapped
                      ? "bg-brand-500/10 border-brand-500/40 shadow-sm shadow-brand-500/10"
                      : "bg-dark-900/60 border-dark-700/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={film.poster || POSTER_FALLBACK}
                        alt={film.title}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = POSTER_FALLBACK; }}
                        className="w-10 h-14 object-cover rounded shadow"
                      />
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {film.title}
                          {wasSwapped && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-500/30 text-brand-200 border border-brand-500/40 flex items-center gap-1">
                              <ArrowRightLeft className="w-2.5 h-2.5" />
                              Swapped
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-brand-300 font-medium">
                          {show.screen_name.split("-")[0].trim()} ({show.capacity} seats)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-400">Demand vs Hall</div>
                      <div className="text-sm font-bold text-white">
                        {show.unconstrained_demand}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          / {show.capacity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-dark-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Admitted:</span>
                      <span className="font-semibold text-emerald-400">{admitted}</span>
                      <span className="text-[11px] text-gray-400">
                        ({Math.round((admitted / show.capacity) * 100)}% fill)
                      </span>
                    </div>

                    {spillover > 0 ? (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        Turnaway: {spillover} (Needs 2nd Show)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Full Capacity Captured
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
