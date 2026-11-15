import React from "react";
import { 
  ShieldCheck, Award, FileText, CheckCircle2, 
  BarChart3, Database, Lock, AlertCircle, Cpu, Zap 
} from "lucide-react";

export default function Governance() {
  const models = [
    {
      name: "LightGBM GBDT Regressor (Champion)",
      role: "Primary Production Forecaster",
      mae: "54.39 seats",
      rmse: "119.84",
      wape: "43.28%",
      turnawayLoss: "955,750 tickets",
      recoveredAdmissions: "+123,006 bookings",
      latency: "1.4 ms",
      status: "Champion (Production Active)",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      name: "PyTorch Tabular DeepNet (Entity Embeddings)",
      role: "High-Dimensional Interaction Benchmark",
      mae: "59.89 seats",
      rmse: "146.22",
      wape: "47.65%",
      turnawayLoss: "1,012,300 tickets",
      recoveredAdmissions: "+66,456 bookings",
      latency: "4.8 ms",
      status: "Challenger / Shadow Mode",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    },
    {
      name: "Capacity-Adjusted Moving Average",
      role: "Heuristic Baseline",
      mae: "94.12 seats",
      rmse: "190.14",
      wape: "74.89%",
      turnawayLoss: "1,078,756 tickets",
      recoveredAdmissions: "Baseline Ref (0)",
      latency: "0.2 ms",
      status: "Baseline Benchmark",
      badgeColor: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    },
  ];

  const featureImportance = [
    { name: "film_demand_lag_3d (T-3 Lagged Sales)", weight: 34.2, color: "bg-brand-500" },
    { name: "cinema_rolling_7d_tickets (Multiplex Footfall)", weight: 24.8, color: "bg-indigo-500" },
    { name: "capacity (Physical Auditorium Seats)", weight: 18.5, color: "bg-emerald-500" },
    { name: "day_of_week (Weekend vs Weekday Elasticity)", weight: 11.3, color: "bg-amber-500" },
    { name: "ticket_price (Dynamic Tariff in IDR)", weight: 6.4, color: "bg-rose-500" },
    { name: "days_since_release (Decay Curve)", weight: 4.8, color: "bg-purple-500" },
  ];

  const auditChecklist = [
    {
      title: "Strict Zero-Contemporaneous Leakage (T-3 Horizon)",
      description: "All lag and rolling features are computed strictly at t <= D - 3 days. No same-day admissions, concurrent ticket counts, or future revenue are used.",
      passed: true,
    },
    {
      title: "Unconstrained Demand vs Physical Capacity Separation",
      description: "True demand D is tracked separately from physical seats C. When D > C, the model preserves unconstrained demand to trigger 2nd staggered screenings.",
      passed: true,
    },
    {
      title: "Chronological Out-of-Time Test Set",
      description: "Strict temporal partition: Train (Feb 21 – Aug 31, 2018), Val (Sep 01 – Sep 30, 2018), Test (Oct 01 – Nov 04, 2018, 22,125 shows). No random shuffling leakage.",
      passed: true,
    },
    {
      title: "Cold-Start & Missing Data Fallback",
      description: "For new films with < 3 days historical data, hierarchical empirical Bayesian shrinkage falls back gracefully to cinema-tier and genre priors.",
      passed: true,
    },
    {
      title: "Anti-Price Gouging & Ethical Constraints",
      description: "Dynamic pricing is strictly bounded within +/- 25% of standard tariff to ensure fair patron access and prevent artificial predatory inflation.",
      passed: true,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="card-glass p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-brand-500/20 text-brand-400 text-xs font-semibold rounded-full border border-brand-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                Production Model Governance & Audit
              </span>
              <span className="text-xs text-gray-400">
                Evaluation on 22,125 Out-of-Time Test Shows
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-2">
              Model Performance, Audit & Explainability
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl mt-1">
              Rigorous verification comparing LightGBM against PyTorch DeepTabularNet and Moving Average baselines. Certified zero data leakage, capacity constraint compliance, and ethical guardrails.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="file:///E:/New%20folder/cinema_demand_forecasting/REPORT.md"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-200 text-sm font-semibold border border-dark-600 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-brand-400" />
              Open Submission REPORT.md
            </a>
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="card-glass p-6 rounded-2xl border border-dark-700/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              Held-Out Test Set Performance Benchmarks
            </h2>
            <p className="text-xs text-gray-400">
              Evaluated on 22,125 unseen shows from Oct 1 to Nov 4, 2018 across 246 multiplexes
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            LightGBM Wins with 42.2% Error Reduction
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-dark-900/90 text-xs uppercase font-semibold text-gray-400 border-b border-dark-700">
              <tr>
                <th className="py-3 px-4">Architecture</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">MAE (Seats)</th>
                <th className="py-3 px-4 text-center">RMSE</th>
                <th className="py-3 px-4 text-center">WAPE (%)</th>
                <th className="py-3 px-4 text-center">Turnaway Loss</th>
                <th className="py-3 px-4 text-center">Bookings Recovered</th>
                <th className="py-3 px-4 text-right">Inference Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60">
              {models.map((m, idx) => (
                <tr key={idx} className="hover:bg-dark-800/40 transition-colors">
                  <td className="py-4 px-4 font-semibold text-white">
                    <div>{m.name}</div>
                    <div className="text-xs text-gray-400 font-normal">{m.role}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${m.badgeColor}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-white">{m.mae}</td>
                  <td className="py-4 px-4 text-center font-medium text-gray-300">{m.rmse}</td>
                  <td className="py-4 px-4 text-center font-medium text-gray-300">{m.wape}</td>
                  <td className="py-4 px-4 text-center font-medium text-amber-300">{m.turnawayLoss}</td>
                  <td className="py-4 px-4 text-center font-bold text-emerald-400">{m.recoveredAdmissions}</td>
                  <td className="py-4 px-4 text-right font-mono text-xs text-brand-300">{m.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importance & Audit Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Importance Chart */}
        <div className="card-glass p-6 rounded-2xl border border-dark-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-400" />
                Champion LightGBM Feature Importance
              </h2>
              <p className="text-xs text-gray-400">
                Gain-based relative importance across 28 engineered predictors
              </p>
            </div>
            <span className="text-xs font-mono text-brand-400">Sum = 100%</span>
          </div>

          <div className="space-y-4 pt-2">
            {featureImportance.map((f, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">{f.name}</span>
                  <span className="text-white font-bold">{f.weight}%</span>
                </div>
                <div className="w-full bg-dark-800 h-2.5 rounded-full overflow-hidden border border-dark-700">
                  <div
                    className={`h-full rounded-full ${f.color}`}
                    style={{ width: `${f.weight * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-dark-900/60 border border-dark-700/60 text-xs text-gray-400">
            <strong className="text-white">Key Takeaway:</strong> The T-3 lagged demand and rolling 7-day theater momentum capture 59% of overall predictive power, confirming that theater habituation and film momentum drive ticket velocity.
          </div>
        </div>

        {/* Audit Checklist */}
        <div className="card-glass p-6 rounded-2xl border border-dark-700/80 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Methodology & Integrity Checklist
            </h2>
            <p className="text-xs text-gray-400">
              Verified compliance with ALGIONS AI LABS enterprise standards
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {auditChecklist.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-dark-900/60 border border-dark-700/60 flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
