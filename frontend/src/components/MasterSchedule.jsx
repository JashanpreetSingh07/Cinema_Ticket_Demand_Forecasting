import React, { useState } from "react";
import { FILM_CATALOG, CINEMA_CATALOG, POSTER_FALLBACK } from "../data/mockCatalog";
import {
  Calendar, Clock, Download, TrendingUp, AlertTriangle,
  Sparkles, Layers, ChevronRight, CheckCircle2, Sliders
} from "lucide-react";

export default function MasterSchedule({ selectedCinema, selectedDate, onNavigateToOptimizer }) {
  const currentCinema = CINEMA_CATALOG[selectedCinema] || Object.values(CINEMA_CATALOG)[0];

  // Screen configuration for the selected cinema
  const screens = [
    { id: 1, name: "Screen 1 - IMAX Grand Theater", capacity: 360, type: "IMAX Laser 3D" },
    { id: 2, name: "Screen 2 - Dolby Atmos Premier", capacity: 250, type: "Dolby Atmos 4K" },
    { id: 3, name: "Screen 3 - Classic Cinema Hall A", capacity: 180, type: "Digital 4K" },
    { id: 4, name: "Screen 4 - Classic Cinema Hall B", capacity: 140, type: "Digital 2K" },
    { id: 5, name: "Screen 5 - VIP Recliner Suite", capacity: 80, type: "VIP Dine-in" },
  ];

  const timeSlots = [
    { slotId: 1, name: "Matinee", time: "12:30 PM", factor: 0.65 },
    { slotId: 2, name: "Afternoon", time: "15:45 PM", factor: 0.85 },
    { slotId: 3, name: "Prime Evening", time: "19:15 PM", factor: 1.55 },
    { slotId: 4, name: "Night Owl", time: "22:30 PM", factor: 1.15 },
  ];

  // Pre-configured realistic film distribution across screens
  const screenFilmAssignments = {
    1: 1492, // Dune: Part Two in IMAX
    2: 1580, // Wicked (Part 1) in Dolby Premier
    3: 1571, // Deadpool & Wolverine in Screen 3
    4: 1582, // Moana 2 in Screen 4
    5: 1554, // Gladiator II in VIP
  };

  // Generate schedule matrix with unconstrained demand vs physical seats
  const scheduleData = [];
  let totalDailyDemand = 0;
  let totalCapacity = 0;
  let totalAdmitted = 0;
  let totalSpillover = 0;
  let totalGrossRevenue = 0;
  let recoverableRevenue = 0;

  screens.forEach((screen) => {
    const filmId = screenFilmAssignments[screen.id];
    const film = FILM_CATALOG[filmId] || Object.values(FILM_CATALOG)[0];

    timeSlots.forEach((slot) => {
      // Calculate realistic demand based on film popularity, slot factor, screen capacity
      const popularityMultiplier = filmId === 1492 ? 1.6 : filmId === 1571 ? 1.4 : filmId === 1480 ? 1.25 : 0.95;
      const baseEstimate = Math.round(screen.capacity * slot.factor * popularityMultiplier);
      const unconstrainedDemand = Math.max(25, baseEstimate);
      const admitted = Math.min(screen.capacity, unconstrainedDemand);
      const spillover = Math.max(0, unconstrainedDemand - screen.capacity);
      const occupancy = Math.min(100, Math.round((admitted / screen.capacity) * 100));
      const revenue = admitted * film.base_price;
      const potentialExtraRevenue = Math.min(screen.capacity, spillover) * film.base_price;

      totalDailyDemand += unconstrainedDemand;
      totalCapacity += screen.capacity;
      totalAdmitted += admitted;
      totalSpillover += spillover;
      totalGrossRevenue += revenue;
      recoverableRevenue += potentialExtraRevenue;

      scheduleData.push({
        screen,
        slot,
        film,
        unconstrainedDemand,
        admitted,
        spillover,
        occupancy,
        revenue,
        potentialExtraRevenue,
        needsSecondShow: spillover >= 35,
      });
    });
  });

  const [filterScreen, setFilterScreen] = useState("all");

  const filteredData = filterScreen === "all"
    ? scheduleData
    : scheduleData.filter((item) => item.screen.id === Number(filterScreen));

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Cinema",
      "Date",
      "Screen",
      "Format",
      "Slot",
      "Time",
      "Film",
      "Capacity",
      "Unconstrained Demand",
      "Admitted Tickets",
      "Spillover Demand",
      "Occupancy (%)",
      "Est Revenue (IDR)",
      "2nd Show Recommended",
    ];

    const rows = scheduleData.map((d) => [
      `"${currentCinema.name}"`,
      selectedDate,
      `"${d.screen.name}"`,
      `"${d.screen.type}"`,
      `"${d.slot.name}"`,
      `"${d.slot.time}"`,
      `"${d.film.title}"`,
      d.screen.capacity,
      d.unconstrainedDemand,
      d.admitted,
      d.spillover,
      `${d.occupancy}%`,
      d.revenue,
      d.needsSecondShow ? "YES (+30m Stagger)" : "NO",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Schedule_${currentCinema.name.replace(/\s+/g, "_")}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Summary */}
      <div className="card-glass p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-brand-500/20 text-brand-400 text-xs font-semibold rounded-full border border-brand-500/30 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Live Multiplex Operations Grid
              </span>
              <span className="text-xs text-gray-400">
                {currentCinema.name} &bull; {selectedDate}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-2">
              Master Daily Showtime & Demand Schedule
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl mt-1">
              Synchronized 5-screen schedule separating unconstrained ticket demand from physical auditorium seats. Identifies bottlenecked sellouts and unlocks multi-screening expansion.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-200 text-sm font-medium border border-dark-600 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-brand-400" />
              Export CSV
            </button>
            <button
              onClick={onNavigateToOptimizer}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Run 1-Click Optimizer
            </button>
          </div>
        </div>

        {/* Global KPIs Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-dark-700/80">
          <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-700/60">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Projected Demand</div>
            <div className="text-2xl font-bold text-white mt-1">
              {totalDailyDemand.toLocaleString()} <span className="text-xs font-normal text-gray-400">patrons</span>
            </div>
            <div className="text-[11px] text-brand-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Unconstrained audience appetite
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-700/60">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Admitted Admissions</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {totalAdmitted.toLocaleString()} <span className="text-xs font-normal text-gray-400">/ {totalCapacity}</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {Math.round((totalAdmitted / totalCapacity) * 100)}% overall fill rate
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/60 border border-amber-500/30 bg-amber-500/5">
            <div className="text-xs font-medium text-amber-400 uppercase tracking-wider">Spillover (Turnaway)</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">
              +{totalSpillover.toLocaleString()} <span className="text-xs font-normal text-gray-400">patrons</span>
            </div>
            <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Unserved due to hall size
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-700/60">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Projected Box Office</div>
            <div className="text-2xl font-bold text-white mt-1">
              ${totalGrossRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Across 20 multiplex slots</div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/60 border border-brand-500/30 bg-brand-500/5 col-span-2 md:col-span-1">
            <div className="text-xs font-medium text-brand-300 uppercase tracking-wider">Recoverable 2nd Show Rev</div>
            <div className="text-2xl font-bold text-brand-300 mt-1">
              +${recoverableRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-brand-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Via 2nd staggered screening
            </div>
          </div>
        </div>
      </div>

      {/* Screen Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap mr-2">Filter by Hall:</span>
          <button
            onClick={() => setFilterScreen("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${filterScreen === "all"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                : "bg-dark-800 text-gray-400 hover:text-white border border-dark-700"
              }`}
          >
            All Screens (5)
          </button>
          {screens.map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterScreen(String(s.id))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filterScreen === String(s.id)
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                  : "bg-dark-800 text-gray-400 hover:text-white border border-dark-700"
                }`}
            >
              {s.name.split("-")[0].trim()} ({s.capacity} seats)
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Table / Grid */}
      <div className="card-glass rounded-2xl overflow-hidden border border-dark-700/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-dark-900/90 text-xs uppercase font-semibold text-gray-400 border-b border-dark-700">
              <tr>
                <th className="py-4 px-5">Auditorium / Screen</th>
                <th className="py-4 px-4">Show Slot & Time</th>
                <th className="py-4 px-5">Film Title & Genre</th>
                <th className="py-4 px-4 text-center">Auditorium Seats</th>
                <th className="py-4 px-4 text-center">Projected Demand</th>
                <th className="py-4 px-4 text-center">Admitted / Occupancy</th>
                <th className="py-4 px-4 text-center">Spillover (Turnaway)</th>
                <th className="py-4 px-5 text-right">Optimization Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60">
              {filteredData.map((item, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-dark-800/40 transition-colors ${item.needsSecondShow ? "bg-amber-500/[0.03]" : ""
                    }`}
                >
                  {/* Screen */}
                  <td className="py-4 px-5 font-medium text-white">
                    <div>{item.screen.name}</div>
                    <div className="text-xs text-gray-400 font-normal">{item.screen.type}</div>
                  </td>

                  {/* Slot */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-gray-200">
                      <Clock className="w-3.5 h-3.5 text-brand-400" />
                      {item.slot.time}
                    </div>
                    <div className="text-xs text-gray-400">{item.slot.name} Slot</div>
                  </td>

                  {/* Film */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.film.poster || POSTER_FALLBACK}
                        alt={item.film.title}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = POSTER_FALLBACK; }}
                        className="w-10 h-14 object-cover rounded shadow-md border border-dark-700 flex-shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-white">{item.film.title}</div>
                        <div className="text-xs text-gray-400">
                          {item.film.genre} &bull; {item.film.runtime}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Capacity */}
                  <td className="py-4 px-4 text-center font-medium text-gray-300">
                    {item.screen.capacity}
                  </td>

                  {/* Unconstrained Demand */}
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-white text-base">
                      {item.unconstrainedDemand}
                    </span>
                    <span className="text-xs text-gray-400 block">patrons</span>
                  </td>

                  {/* Admitted & Occupancy */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-emerald-400">
                        {item.admitted} seats
                      </span>
                      <div className="w-24 bg-dark-700 h-2 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full rounded-full ${item.occupancy >= 95
                              ? "bg-emerald-500"
                              : item.occupancy >= 65
                                ? "bg-brand-500"
                                : "bg-amber-500"
                            }`}
                          style={{ width: `${item.occupancy}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1">{item.occupancy}% fill</span>
                    </div>
                  </td>

                  {/* Spillover */}
                  <td className="py-4 px-4 text-center">
                    {item.spillover > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        +{item.spillover} turnaway
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Zero turnaway
                      </span>
                    )}
                  </td>

                  {/* Action / Tag */}
                  <td className="py-4 px-5 text-right">
                    {item.needsSecondShow ? (
                      <div className="inline-flex flex-col items-end">
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40 flex items-center gap-1.5 shadow-sm">
                          <Sparkles className="w-3 h-3 text-brand-400" />
                          2nd Show Recommended
                        </span>
                        <span className="text-[11px] text-emerald-400 mt-1">
                          +${item.potentialExtraRevenue.toLocaleString()} recoverable
                        </span>
                      </div>
                    ) : item.occupancy < 40 ? (
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-dark-800 text-gray-400 border border-dark-700">
                        Low Fill (Swap Hall)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Optimal Hall Match
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
