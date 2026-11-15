import React, { useState, useMemo } from "react";
import { FILM_CATALOG, POSTER_FALLBACK } from "../data/mockCatalog";
import { 
  DollarSign, TrendingUp, Sliders, Sparkles, 
  Target, Info, ArrowUpRight, ArrowDownRight, Layers 
} from "lucide-react";

export default function PriceElasticity() {
  const [selectedFilmId, setSelectedFilmId] = useState(1492); // Dune 2
  const [capacity, setCapacity] = useState(250);
  const [currentPrice, setCurrentPrice] = useState(18);

  const film = FILM_CATALOG[selectedFilmId] || Object.values(FILM_CATALOG)[0];
  const basePrice = film.base_price || 18;
  const elasticity = -1.15; // Empirical price elasticity coefficient for cinema exhibition

  // Base unconstrained demand at standard ticket price
  const baseDemand = selectedFilmId === 1492 ? 340 : selectedFilmId === 1571 ? 310 : 220;

  // Generate price curve points from $8 to $36 in steps of $1
  const priceCurve = useMemo(() => {
    const points = [];
    const minPrice = 8;
    const maxPrice = 36;
    const step = 1;

    let maxRev = 0;
    let optPrice = basePrice;

    for (let p = minPrice; p <= maxPrice; p += step) {
      // D(P) = D_0 * (P / P_0)^elasticity
      const demand = Math.round(baseDemand * Math.pow(p / basePrice, elasticity));
      const admitted = Math.min(capacity, demand);
      const revenue = admitted * p;

      if (revenue > maxRev) {
        maxRev = revenue;
        optPrice = p;
      }

      points.push({
        price: p,
        demand,
        admitted,
        spillover: Math.max(0, demand - capacity),
        revenue,
        occupancy: Math.min(100, Math.round((admitted / capacity) * 100)),
      });
    }

    return { points, maxRev, optPrice };
  }, [selectedFilmId, capacity, basePrice, baseDemand]);

  // Current selected point stats
  const currentDemand = Math.round(baseDemand * Math.pow(currentPrice / basePrice, elasticity));
  const currentAdmitted = Math.min(capacity, currentDemand);
  const currentRevenue = currentAdmitted * currentPrice;
  const currentOccupancy = Math.min(100, Math.round((currentAdmitted / capacity) * 100));

  // Optimal point stats
  const optDemand = Math.round(baseDemand * Math.pow(priceCurve.optPrice / basePrice, elasticity));
  const optAdmitted = Math.min(capacity, optDemand);
  const optRevenue = optAdmitted * priceCurve.optPrice;
  const revDiff = currentRevenue - (Math.min(capacity, baseDemand) * basePrice);

  // SVG Chart rendering calculations
  const chartHeight = 220;
  const chartWidth = 700;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const minP = 8;
  const maxP = 36;
  const maxRevenueVal = priceCurve.maxRev * 1.15;

  const getX = (p) => padding.left + ((p - minP) / (maxP - minP)) * innerWidth;
  const getY = (rev) => padding.top + innerHeight - (rev / maxRevenueVal) * innerHeight;

  const pathD = priceCurve.points.reduce((acc, pt, idx) => {
    const x = getX(pt.price);
    const y = getY(pt.revenue);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="card-glass p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-brand-500/20 text-brand-400 text-xs font-semibold rounded-full border border-brand-500/30 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Price Elasticity & Yield Optimization
              </span>
              <span className="text-xs text-gray-400">
                Empirical Cinema Elasticity &epsilon; = {elasticity}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-2">
              Dynamic Pricing Studio & Revenue Curve
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl mt-1">
              Simulate customer willingness-to-pay. Discover the optimal ticket price point ($P^*$) that maximizes gross box office while respecting physical auditorium capacity.
            </p>
          </div>

          {/* Film Selector Pill */}
          <div className="flex items-center gap-3">
            <select
              value={selectedFilmId}
              onChange={(e) => {
                const fId = Number(e.target.value);
                setSelectedFilmId(fId);
                setCurrentPrice(FILM_CATALOG[fId].base_price || 15);
              }}
              className="bg-dark-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl border border-dark-600 focus:outline-none focus:border-brand-500 cursor-pointer shadow-sm"
            >
              {Object.values(FILM_CATALOG).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} (Base: ${f.base_price})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-dark-700/80">
          <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-700/60">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Current Simulated Price
            </div>
            <div className="text-3xl font-bold text-white mt-1">
              ${currentPrice}
            </div>
            <div className="text-xs text-brand-400 mt-1 flex items-center gap-1">
              {currentPrice > basePrice ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">
                    +{Math.round(((currentPrice - basePrice) / basePrice) * 100)}% premium
                  </span>
                </>
              ) : currentPrice < basePrice ? (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">
                    -{Math.round(((basePrice - currentPrice) / basePrice) * 100)}% discount
                  </span>
                </>
              ) : (
                "Standard Base Rate"
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-700/60">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Predicted Attendance
            </div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">
              {currentAdmitted}{" "}
              <span className="text-xs font-normal text-gray-400">/ {capacity}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {currentOccupancy}% occupancy &bull; Demand: {currentDemand}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-700/60">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Projected Show Gross
            </div>
            <div className="text-3xl font-bold text-white mt-1">
              ${currentRevenue.toLocaleString()}
            </div>
            <div className="text-xs mt-1 flex items-center gap-1">
              {revDiff >= 0 ? (
                <span className="text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +${revDiff.toLocaleString()} vs base
                </span>
              ) : (
                <span className="text-rose-400 flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" /> -${Math.abs(revDiff).toLocaleString()} vs base
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30">
            <div className="text-xs font-medium text-brand-300 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-brand-400" /> AI Optimal Price (P*)
            </div>
            <div className="text-3xl font-bold text-brand-300 mt-1">
              ${priceCurve.optPrice}
            </div>
            <div className="text-xs text-brand-400 mt-1">
              Max potential: ${priceCurve.maxRev.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Pricing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interactive Controls Card */}
        <div className="card-glass p-6 rounded-2xl border border-dark-700/80 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-400" />
            Pricing & Hall Controls
          </h2>

          {/* Film Details */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-dark-900/60 border border-dark-700/60">
            <img
              src={film.poster || POSTER_FALLBACK}
              alt={film.title}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = POSTER_FALLBACK; }}
              className="w-12 h-16 object-cover rounded-lg shadow"
            />
            <div>
              <div className="font-bold text-white text-sm">{film.title}</div>
              <div className="text-xs text-gray-400">{film.genre}</div>
              <div className="text-xs text-brand-400 mt-1">
                Base Price: ${basePrice}
              </div>
            </div>
          </div>

          {/* Ticket Price Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Ticket Price ($ USD):</span>
              <span className="text-brand-300 font-bold text-sm">
                ${currentPrice}
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={35}
              step={1}
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer h-2 bg-dark-700 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>$8 (Matinee)</span>
              <span className="text-brand-400 font-semibold cursor-pointer" onClick={() => setCurrentPrice(priceCurve.optPrice)}>
                P* (${priceCurve.optPrice})
              </span>
              <span>$35 (VIP/IMAX)</span>
            </div>
          </div>

          {/* Hall Capacity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Hall Physical Capacity:</span>
              <span className="text-white font-bold">{capacity} seats</span>
            </div>
            <input
              type="range"
              min={80}
              max={380}
              step={10}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer h-2 bg-dark-700 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>80 (VIP)</span>
              <span>200 (Standard)</span>
              <span>380 (IMAX)</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-2">
            <div className="text-xs text-gray-400 font-medium mb-2">Price Strategy Presets:</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setCurrentPrice(Math.max(8, Math.round(basePrice * 0.8)))}
                className="py-2 px-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-[11px] font-medium text-gray-300 border border-dark-600 transition-all text-center"
              >
                Matinee (-20%)
              </button>
              <button
                onClick={() => setCurrentPrice(basePrice)}
                className="py-2 px-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-[11px] font-medium text-gray-300 border border-dark-600 transition-all text-center"
              >
                Standard (${basePrice})
              </button>
              <button
                onClick={() => setCurrentPrice(priceCurve.optPrice)}
                className="py-2 px-2.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-[11px] font-semibold text-brand-300 border border-brand-500/40 transition-all text-center"
              >
                Optimal P* (${priceCurve.optPrice})
              </button>
            </div>
          </div>

          {/* Dynamic Elasticity Note */}
          <div className="p-3.5 rounded-xl bg-dark-900/80 border border-dark-700/80 text-xs text-gray-400 space-y-1">
            <div className="font-semibold text-gray-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-400" />
              Elasticity Safeguard
            </div>
            <p className="text-[11px] leading-relaxed">
              Cinema entertainment is moderately elastic (&epsilon; &approx; -1.15). Raising prices above P* rapidly causes patron dropoff and lowers total gross revenue.
            </p>
          </div>
        </div>

        {/* Dynamic SVG Revenue Curve Chart */}
        <div className="card-glass p-6 rounded-2xl border border-dark-700/80 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Revenue vs Ticket Price Optimization Curve
                </h3>
                <p className="text-xs text-gray-400">
                  Total Show Gross ($ USD) as a function of ticket price
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-brand-400 font-medium">
                  <span className="w-3 h-0.5 bg-brand-400 rounded-full" /> Revenue Curve
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Selected Price
                </span>
                <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Peak Yield (P*)
                </span>
              </div>
            </div>

            {/* SVG Plot */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto select-none"
              >
                {/* Grid horizontal lines */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                  const y = padding.top + innerHeight * (1 - ratio);
                  const revVal = maxRevenueVal * ratio;
                  return (
                    <g key={ratio}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="4 4"
                        strokeOpacity="0.6"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="end"
                      >
                        ${Math.round(revVal).toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Ticks */}
                {[8, 12, 16, 20, 24, 28, 32, 36].map((p) => {
                  const x = getX(p);
                  return (
                    <g key={p}>
                      <line
                        x1={x}
                        y1={chartHeight - padding.bottom}
                        x2={x}
                        y2={chartHeight - padding.bottom + 6}
                        stroke="#64748b"
                      />
                      <text
                        x={x}
                        y={chartHeight - padding.bottom + 18}
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        ${p}
                      </text>
                    </g>
                  );
                })}

                {/* Path line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#revGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Gradients */}
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Optimal point marker */}
                <g>
                  <circle
                    cx={getX(priceCurve.optPrice)}
                    cy={getY(priceCurve.maxRev)}
                    r="6"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={getX(priceCurve.optPrice)}
                    y={getY(priceCurve.maxRev) - 12}
                    fill="#f59e0b"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    P* (${priceCurve.optPrice})
                  </text>
                </g>

                {/* Current point marker */}
                <g>
                  <line
                    x1={getX(currentPrice)}
                    y1={padding.top}
                    x2={getX(currentPrice)}
                    y2={chartHeight - padding.bottom}
                    stroke="#34d399"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={getX(currentPrice)}
                    cy={getY(currentRevenue)}
                    r="7"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              </svg>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dark-700/80 flex items-center justify-between text-xs text-gray-400">
            <span>
              Optimal P* achieves{" "}
              <strong className="text-white">${priceCurve.maxRev.toLocaleString()}</strong> with{" "}
              <strong className="text-white">{optAdmitted} seats</strong> sold.
            </span>
            <button
              onClick={() => setCurrentPrice(priceCurve.optPrice)}
              className="text-brand-400 hover:text-brand-300 font-semibold underline"
            >
              Set to Optimal Price Point (${priceCurve.optPrice})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
