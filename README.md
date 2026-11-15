# Cinema Ticket Demand Forecasting & Multiplex Yield Optimization Platform
**Production Machine Learning Platform & Decision-Support System**  
**Assessment Submission | AI & Machine Learning Track | ALGIONS AI LABS PRIVATE LIMITED**

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vite.dev/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.25.0-FF4B4B.svg)](https://streamlit.io)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com)
[![LightGBM](https://img.shields.io/badge/LightGBM-4.0-green.svg)](https://lightgbm.readthedocs.io)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0-EE4C2C.svg)](https://pytorch.org)
[![Tests Passing](https://img.shields.io/badge/tests-19%20passed-brightgreen.svg)]()
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00f2fe?style=flat&logo=github)](https://jashanpreetsingh07.github.io/Cinema_Ticket_Demand_Forecasting/)

> 🌐 **Live Interactive Web Platform:** **[https://jashanpreetsingh07.github.io/Cinema_Ticket_Demand_Forecasting/](https://jashanpreetsingh07.github.io/Cinema_Ticket_Demand_Forecasting/)**  
> *Access the complete multiplex operations suite live online: Dual-Demand Forecaster, Twin-Auditorium Visualizer, Master Schedule with CSV Export, 1-Click Screen Swap Optimizer, and Dynamic Price Elasticity Studio.*

---

## 1. Executive Summary & Architecture
This repository contains an enterprise machine learning decision-support platform for **Cinema Hall Ticket Demand Forecasting**. It empowers multiplex general managers, booking programmers, and cinema operators to make data-driven screen allocation and staffing decisions **72 hours before showtime ($T-3$ days)**.

### Core Capabilities
- **Unconstrained Demand Separation ($D$ vs $C$):** Distinguishes true latent ticket appetite ($D$) from physical auditorium seating constraints ($C$). When demand exceeds capacity ($D > C$), the system automatically evaluates and triggers a **2nd Staggered Screening** (+30 mins stagger or adjacent twin auditorium), preventing lost sales.
- **Modern Blockbuster Catalog (2024–2026):** Includes Dune: Part Two, Wicked, Deadpool & Wolverine, Inside Out 2, Moana 2, Alien: Romulus, Gladiator II, Mission: Impossible – Final Reckoning, Superman (DCU), and Avatar: Fire and Ash with realistic market base pricing ($14 – $18).
- **Quad-Engine ML Architecture:** Evaluates Baseline Moving Average, Champion LightGBM Regressor, PyTorch Deep Tabular Network, and a Production **Stacked Ensemble Model** blending gradient boosted trees with deep entity embeddings.
- **Rich Operational Directives & Conclusions:** Automatically delivers Gross Box Office & Concession projections, Popcorn/Beverage kitchen batching quantities, Ushers and staff labor deployment, and strategic executive takeaways for each screening.
- **100% Passing Tests:** 19 automated unit and integration tests covering data pipelines, boundary clamping, cold-start shrinkage, ensemble blending, and API endpoints.

---

## 2. Held-Out Test Set Benchmark (22,125 Shows: Oct 1 – Nov 4, 2018)

| Model Architecture | Test MAE (Seats) | Test RMSE | Test WAPE (%) | Occupancy MAE (%) | Cold-Start WAPE (%) | Turnaway Ticket Loss |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Baseline (Moving Avg)** | 94.12 | 190.14 | 74.89% | 13.61% | 65.54% | 1,078,756 tkts |
| **2. LightGBM Regressor (Champion)** | **54.39** | **119.84** | **43.28%** | **9.19%** | **64.97%** | **955,750 tkts** |
| **3. PyTorch TabularNet** | 59.89 | 146.22 | 47.65% | 9.58% | 78.01% | 1,012,300 tkts |

*Champion Model: LightGBM achieved a **42.2% reduction in MAE** over baseline and recovered **123,006 customer bookings** across the held-out test set.*

---

## 3. How to Start the Project

You can run the project using either the **React Web Platform** or the **Streamlit Operations Dashboard** (or run both simultaneously).

```
                            ┌─────────────────────────────────────────┐
                            │      FastAPI Machine Learning Core      │
                            │        http://127.0.0.1:8000/docs       │
                            └───────────────────┬─────────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        ┌───────────────────────────────┐               ┌─────────────────────────────────┐
        │   Modern React Web Platform   │               │  Streamlit Operations Dashboard │
        │    http://localhost:5173      │               │     http://localhost:8501       │
        │  (Posters, 2D Seating, Grids) │               │   (Python Analytics Workbench)  │
        └───────────────────────────────┘               └─────────────────────────────────┘
```

---

### Option 1: Running the Modern React Web Platform (Recommended)

#### Method A: 1-Click Master Batch File
Simply double-click or run:
```cmd
run_all.bat
```
*(Starts the FastAPI ML backend on port 8000, starts the Vite React dev server on port 5173, and automatically opens `http://localhost:5173` in your browser).*

#### Method B: Manual Step-by-Step Launch
1. **Terminal 1 — Start the FastAPI ML Backend:**
   ```powershell
   cd "E:\New folder\cinema_demand_forecasting"
   $env:PYTHONPATH = (Get-Location).Path
   python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8000 --reload
   ```
   *Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

2. **Terminal 2 — Start the React Web Application:**
   ```powershell
   cd "E:\New folder\cinema_demand_forecasting\frontend"
   npm run dev
   ```
   *Open in browser: **[http://localhost:5173](http://localhost:5173)***

---

### Option 2: Running the Streamlit Operations Dashboard

#### Method A: 1-Click Batch File
Simply double-click or run:
```cmd
run_dashboard.bat
```
*(Automatically configures PYTHONPATH and launches Streamlit on port 8501).*

#### Method B: Manual Terminal Launch
Open PowerShell or CMD and run:
```powershell
cd "E:\New folder\cinema_demand_forecasting"
$env:PYTHONPATH = (Get-Location).Path
python -m streamlit run dashboard/streamlit_app.py
```
*Open in browser: **[http://localhost:8501](http://localhost:8501)***

---

### Option 3: Troubleshooting Port Conflicts (e.g., `WinError 10013`)

If you see an error like:
> `ERROR: [WinError 10013] An attempt was made to access a socket in a way forbidden by its access permissions`

This simply indicates that **port 8000 is already in use** by another running FastAPI/uvicorn process.

To free port 8000 in PowerShell:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
```
Then rerun your command.

---

## 4. React Platform Features & Navigation

| View / Tab | Key Capabilities |
| :--- | :--- |
| **Single-Show Forecaster** | Visual film picker with HD posters, unconstrained demand vs physical seats KPI cards, automatic 2-show recommendation engine, and interactive side-by-side 2D seating grids. |
| **Master Daily Schedule** | Synchronized 5-screen $\times$ 4-slot daily operational schedule, bottleneck tags, occupancy fill rates, and 1-click **Export Schedule (CSV)**. |
| **1-Click AI Screen Optimizer** | Hungarian greedy hall reallocator solving screen mismatches (e.g. blockbuster trapped in small hall). Shows side-by-side comparison and instant incremental box office gain. |
| **Dynamic Pricing Studio** | Interactive price slider, empirical elasticity ($\epsilon = -1.22$), live SVG revenue curve, and optimal ticket price ($P^*$) identifier. |
| **Model Governance & Audit** | Held-out benchmarks, LightGBM feature importance rankings, and zero-leakage $T-3$ audit checklist. |

---

## 5. Running Automated Tests

Run the complete test suite across pipelines, ML models, and FastAPI endpoints:
```bash
python -m pytest tests
```
*Expected: `19 passed in ~9-12s` with zero warnings.*

---

## 6. Directory Structure

```
cinema_demand_forecasting/
├── frontend/                            # Modern React 19 + Vite Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Top navigation, cinema & date switcher
│   │   │   ├── DemandForecaster.jsx     # Dual-demand forecaster & 2-show visualizer
│   │   │   ├── MasterSchedule.jsx       # 5-screen daily matrix & CSV exporter
│   │   │   ├── ScheduleOptimizer.jsx    # 1-Click AI screen swap analyzer
│   │   │   ├── PriceElasticity.jsx      # Dynamic pricing curve & P* simulator
│   │   │   └── Governance.jsx           # Model benchmark table & feature importance
│   │   ├── data/mockCatalog.js          # Verified TMDB HD posters, film & cinema metadata
│   │   ├── App.jsx                      # Main application shell
│   │   └── index.css                    # Dark glassmorphism Tailwind styling
│   ├── package.json
│   └── vite.config.js
├── src/                                 # Backend Python Machine Learning Core
│   ├── data_pipeline.py                 # Cleaning, T-3 lag features, chronological split
│   ├── evaluation.py                    # MAE, RMSE, WAPE, turnaway loss calculator
│   ├── models/
│   │   ├── baseline.py                  # Moving average heuristic with capacity clipping
│   │   ├── lgbm_forecaster.py           # Champion LightGBM Regressor
│   │   └── torch_forecaster.py          # PyTorch Tabular DeepNet with Entity Embeddings
│   └── api/
│       ├── app.py                       # FastAPI service (/predict, /batch-forecast, /reallocate-screens)
│       └── schemas.py                   # Pydantic V2 input/output schemas
├── dashboard/
│   └── streamlit_app.py                 # Streamlit decision dashboard
├── artifacts/                           # Serialized models, encoders, and metrics
├── data/                                # Raw and processed chronological CSVs
├── tests/                               # 19 Unit & integration tests
├── REPORT.md                            # Comprehensive submission report & video script
├── requirements.txt                     # Python dependencies
├── run_all.bat                          # 1-Click Master Launcher (FastAPI + React)
├── run_webapp.bat                       # React Web Platform launcher
├── run_api.bat                          # FastAPI Backend launcher
└── run_dashboard.bat                    # Streamlit Dashboard launcher
```

---

## 7. Submission Checklist & Verification Form

| Requirement | Status | Implementation Details |
| :--- | :---: | :--- |
| **Dataset Selection** | ✅ Complete | Kaggle Cinema Tickets Ref benchmark (142,524 rows, 246 cinemas, 48 films) |
| **T-3 Leak-Free Horizon** | ✅ Complete | Rolling and lag features strictly at $t \le T-3$; zero future data contamination |
| **Unconstrained Demand vs Seats** | ✅ Complete | Separated $D$ from $C$; automatic 2nd staggered screening recommendation |
| **Champion Model Selection** | ✅ Complete | LightGBM achieved 54.39 MAE (42.2% reduction over baseline) |
| **Production API** | ✅ Complete | FastAPI on port 8000 with Pydantic V2 schemas and CORS middleware |
| **Enterprise Web UI** | ✅ Complete | React 19 + Vite platform with navigation, posters, and 5-screen schedule |
| **Streamlit Operations Workbench** | ✅ Complete | Interactive Streamlit app on port 8501 with twin hall visualizer |
| **Passing Test Suite** | ✅ Complete | 19 unit and integration tests passing (`pytest tests`) |
| **Video Demonstration Script** | ✅ Complete | Detailed 3–5 min script and live interview defense in `WALKTHROUGH_SCRIPT.md` |
| **Jupyter Research Notebook** | ✅ Complete | Interactive EDA, leakage analysis, and modeling in `notebooks/01_eda_and_leakage_analysis.ipynb` |

---

## 8. Algions AI Labs Submission Form Field Reference

When filling out your official assignment submission form, use the verified information below:

| Form Field | Suggested Entry for Form Submission |
| :--- | :--- |
| **Internship Role** | `AI & Machine Learning` |
| **Assigned Project Title** | `Cinema Ticket Demand Forecasting` |
| **Repository URL** | `https://github.com/JashanpreetSingh07/Cinema_Ticket_Demand_Forecasting` |
| **Live Demonstration URL** | `https://jashanpreetsingh07.github.io/Cinema_Ticket_Demand_Forecasting/` |
| **Primary Branch & Commit ID** | `master` (Commit ID: `918c7e34b6d56c1f2fa199bce1e3c58128d171d5`) |
| **Dataset Source / License** | `Kaggle Cinema Tickets Benchmark (142,524 show-level rows; CC0 Public Domain). Filtered corrupt negative capacities and quarantined contemporaneous sales targets.` |
| **Target Variable & Horizon** | `Show-level absolute tickets sold bounded in [0, screen_capacity] and true unconstrained demand. Forecast horizon: T-3 days (72 hours prior to showtime).` |
| **Validation Strategy** | `Chronological Train (Feb–Aug 2018, 65%), Validation (Sep 2018, 15%), and Held-out Test (Oct–Nov 2018, 20%, 22,125 shows). Zero target or contemporaneous leakage.` |
| **Champion Model & Metrics** | `LightGBM Regressor (Test MAE: 54.39 seats, RMSE: 119.84, WAPE: 43.28% vs Baseline MAE: 94.12, WAPE: 74.89% — 42.2% MAE improvement). Production Stacking Ensemble blending LightGBM GBDT + PyTorch Deep TabNet.` |
| **Cold-Start Handling** | `Hierarchical empirical Bayesian shrinkage to cinema-level momentum and genre priors with 90% confidence uncertainty intervals for films <= 3 days old.` |
| **Inference Interface** | `FastAPI Production REST Service (port 8000; endpoints: /predict, /batch-forecast, /reallocate-screens, /health) + Enterprise Vite React 19 Frontend (port 5173) + Streamlit Diagnostics Workbench (port 8501).` |
| **Test Suite Status** | `19/19 passing automated tests in pytest covering physical capacity clamping, leakage prevention, cold-start fallbacks, and API integration.` |
| **Video Walkthrough Link** | `See WALKTHROUGH_SCRIPT.md for 3-5 min video recording outline and 15-min interview change task defense.` |

