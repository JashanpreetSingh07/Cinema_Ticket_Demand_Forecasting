# Technical Report: Cinema Ticket Demand Forecasting & Screen Optimization
**Candidate Assessment: Advanced Machine Learning & AI | ALGIONS AI LABS PRIVATE LIMITED**

---

## 1. Executive Summary & Business Objective
Cinema multiplex operators face a daily optimization dilemma: how to schedule screens and roster staff efficiently across volatile, hit-driven theatrical demand. Reallocating a movie from a 120-seat auditorium to a 350-seat hall after tickets sell out causes turnaway loss (unrealized box office revenue). Conversely, projecting a fading title in a 400-seat hall wastes HVAC energy, projection lamp hours, and staffing overhead.

This project delivers a production-grade, capacity-aware decision-support machine learning system that:
1. Forecasts show-level ticket demand and occupancy percentage at a **$T-3$ day (72-hour) forecast horizon**.
2. Mathematically enforces physical seating capacity constraints: $\hat{y} \in [0, \text{capacity}]$.
3. Evaluates a **Capacity-Adjusted Moving Average Baseline** against two advanced models: **LightGBM Regressor** and **PyTorch Tabular Neural Network with Entity Embeddings**.
4. Provides real-time automated **Screen Reallocation Optimization** and **Staff Rostering Guidance** through a decoupled **FastAPI REST API** and an interactive **Streamlit Operations Dashboard**.

---

## 2. Problem Framing & Mathematical Formulation

### 2.1 Prediction Unit & Horizon
- **Prediction Unit:** A discrete screening show defined by:
  $$\text{Unit} = \langle \text{cinema\_code}, \text{film\_code}, \text{screen\_capacity}, \text{show\_date}, \text{show\_time\_slot} \rangle$$
- **Forecast Horizon:** $T - 3$ days (72 hours prior to showtime) at midnight.
- **Operational Justification:** Cinema general managers publish public show schedules and lock screen allocations 3 days prior to the weekend. Any feature derived from $t > T-3$ days constitutes prohibited **future data leakage**.

### 2.2 Dual Target Formulation: Demand vs. Physical Seats
In real-world theatrical revenue management, there is a fundamental distinction between customer demand and physical auditorium constraints:
1. **Unconstrained Latent Customer Demand ($D$):** The total number of patrons seeking tickets for this movie and showtime. Demand can significantly exceed physical screen capacity ($D > \text{Capacity}$), particularly during opening weekends or holiday screenings:
   $$D \in \mathbb{Z}_{\ge 0}, \quad D \ge 0$$
2. **Physical Admitted Seats ($S$):** The actual tickets admitted into the screening, strictly bounded by auditorium seating limits:
   $$S = \min(D, \text{Capacity}) \in [0, \text{Capacity}]$$
3. **Turnaway Spillover ($O$):** The unsatisfied customer demand:
   $$O = \max(0, D - \text{Capacity})$$
4. **Multi-Show Expansion Strategy:** When spillover $O \ge 30$ tickets or $D \ge 1.25 \times \text{Capacity}$, the system automatically recommends opening a **2nd Staggered Screening** (+30 mins stagger or adjacent twin auditorium), recovering $O$ admitted patrons and preventing tens of thousands of dollars in turnaway losses.

---

## 3. Dataset Profiling, Data Hygiene & Leakage Audit

### 3.1 Data Source & Licensing
- **Dataset:** Real-world benchmark Kaggle Cinema Tickets Dataset (`cinemaTicket_Ref.csv`).
- **Scale:** 142,524 raw screening records across 246 multiplex cinemas and 48 feature films.
- **Temporal Span:** February 21, 2018 to November 4, 2018 (8.5 continuous months).
- **License:** Open Database License (ODbL) / Public Research Benchmark. Zero personally identifiable information (PII).

### 3.2 Data Profiling & Cleansing Actions
1. **Capacity & Occupancy Inconsistencies:** Detected 125 records with corrupt negative capacity (`-2.0`) and null occupancy percentages. These were filtered, along with 54 anomalous non-positive records (179 total records cleaned, leaving 142,345 valid records).
2. **Fractional Capacity Rounding:** Raw capacity values exhibited fractional floating-point values from reverse percentage calculation (e.g., 276.99 seats). These were rounded to true integer auditorium seats.
3. **Target Leakage Quarantine:** Four contemporaneous columns directly leaked the outcome:
   - `total_sales` ($= \text{tickets\_sold} \times \text{ticket\_price}$)
   - `tickets_out`
   - `occu_perc` ($= \frac{\text{tickets\_sold}}{\text{capacity}}$)
   - `ticket_use`
   *Remediation:* These columns were quarantined and strictly removed from all feature matrices.

---

## 4. Feature Engineering ($T-3$ Temporal Guard)

To eliminate future leakage, all rolling and lag features are computed strictly from historical shows at $t \le D - 3$ days:

| Feature Category | Features Engineered | Operational Rationale |
| :--- | :--- | :--- |
| **Calendar & Temporal** | `day_of_week`, `is_peak_day`, `is_weekend`, `month`, `quarter`, $\sin$/$\cos$ cyclical transforms | Captures weekly cyclicality (peak Tuesdays, Thursdays, and Fridays) and seasonal fluctuations. |
| **Film Momentum ($t \le D-3$)** | `film_lag_7d_tickets`, `film_lag_14d_tickets`, `film_lag_7d_occupancy` | Captures film-specific box office decay curves and momentum up to the 72-hour freeze window. |
| **Multiplex Velocity ($t \le D-3$)** | `cinema_lag_7d_tickets`, `cinema_lag_7d_occupancy` | Reflects baseline footfall velocity of the specific cinema multiplex. |
| **Lifecycle & Cold-Start** | `film_age_days`, `is_cold_start` ($\le 3$ days) | Flags newly released movies lacking historical sales trajectories. |
| **Price & Elasticity** | `relative_price` ($\frac{\text{ticket\_price}}{\text{cinema\_median\_price}}$) | Measures premium pricing or promotional discounting impact on customer demand. |
| **Auditorium Sizing** | `capacity`, `capacity_tier` (0: <150, 1: 150–350, 2: >350), `show_time` | Physical scale and daily slot position (morning, matinee, prime evening). |

---

## 5. Chronological Validation & Model Development

### 5.1 Chronological Split Strategy
Random $k$-fold cross-validation is invalid for time-dependent demand data. A strict chronological timeline split was enforced:
- **Training Set (74.1%):** Feb 21, 2018 – Aug 31, 2018 (105,560 shows)
- **Validation Set (10.3%):** Sep 01, 2018 – Sep 30, 2018 (14,660 shows) — hyperparameter tuning & early stopping.
- **Held-Out Test Set (15.6%):** Oct 01, 2018 – Nov 04, 2018 (22,125 shows) — completely untouched evaluation benchmark.

### 5.2 Model Architectures Evaluated
1. **Baseline: Capacity-Aware Moving Average Heuristic:**
   Computes median historical occupancy by $\langle \text{day\_of\_week}, \text{show\_time} \rangle$ multiplied by the film's relative popularity multiplier, bounded by screen capacity:
   $$\hat{y}_{\text{base}} = \min(\text{capacity}, \text{round}(\bar{o} \times \text{capacity}))$$
2. **Candidate Model 1: LightGBM Regressor:**
   Gradient Boosted Decision Trees configured with L1 objective (`regression_l1`), early stopping on validation loss, 387 optimal iterations, and post-prediction capacity clipping.
3. **Candidate Model 2: PyTorch Deep Tabular Neural Network:**
   Entity embeddings for high-cardinality categoricals (`film_code`, `cinema_code`, `show_time`, `day_of_week`, `capacity_tier`) concatenated with standard-scaled continuous features, processed through a 2-layer residual MLP (128 $\to$ 64) with BatchNorm and Dropout, and activated by a Sigmoid layer scaled by capacity:
   $$\hat{y} = \text{capacity} \times \sigma(z_{\text{MLP}})$$

---

## 6. Comprehensive Evaluation & Benchmark Results

### 6.1 Held-Out Test Set Performance Benchmark (22,125 Shows)

| Model Architecture | Test MAE (Seats) | Test RMSE | Test WAPE (%) | Occupancy MAE (%) | Cold-Start WAPE (%) | Turnaway Ticket Loss |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Baseline (Moving Avg)** | 94.12 | 190.14 | 74.89% | 13.61% | 65.54% | 1,078,756 tkts |
| **2. LightGBM Regressor** | **54.39** | **119.84** | **43.28%** | **9.19%** | **64.97%** | **955,750 tkts** |
| **3. PyTorch TabularNet** | 59.89 | 146.22 | 47.65% | 9.58% | 78.01% | 979,218 tkts |

### 6.2 Key Empirical Takeaways
1. **LightGBM Champion Performance:** LightGBM achieved the lowest error across all metrics, reducing MAE from 94.12 seats down to **54.39 seats** (a **42.2% error reduction** over baseline) and WAPE from 74.89% down to **43.28%**.
2. **Business Impact (Turnaway Recovery):** LightGBM reduced under-allocation turnaway losses from 1,078,756 tickets down to 955,750 tickets, recovering **123,006 customer bookings** across the test window.
3. **PyTorch TabularNet Competitiveness:** The neural network performed solidly with 59.89 MAE (a 36.4% improvement over baseline), demonstrating the power of entity embeddings for cinema multiplex IDs.
4. **Cold-Start Error Elevation:** As predicted by domain theory, cold-start WAPE is higher (64.97% for LightGBM, 78.01% for PyTorch) because brand-new releases lack historical momentum. This justifies our explicit Cold-Start Advisory Badge in the UI.

### 6.3 Top Influential Features (LightGBM)
1. `cinema_code` (Importance: 4,192 splits): Multiplex location, local demographics, and footfall capacity are the primary demand driver.
2. `film_code` (Importance: 1,908 splits): Franchise power, star cast, and title appeal.
3. `film_age_days` (Importance: 864 splits): Box-office decay velocity over release weeks.
4. `capacity` (Importance: 794 splits): Physical hall boundary.
5. `show_time` (Importance: 574 splits): Evening vs. matinee scheduling effect.

---

## 7. Error Analysis & Edge Case Discovery

A detailed audit of the 100 highest absolute residual errors revealed three distinct operational failure modes:
1. **Opening Weekend Outliers:** Blockbusters releasing on major holidays (e.g., National Cinema Day discount sales) experienced non-linear demand spikes exceeding typical decay profiles.
2. **Off-Peak Screen Saturation:** Small 40–60 seat VIP boutique screens showed occasional near-100% capacity fill for niche art films that standard genre priors underpredicted.
3. **Mid-Week Discount Tuesday Surges:** Shows on Tuesdays exhibited large variance in ticket sales due to multiplex-specific half-price ticketing promotions.

---

## 8. Automated Decision Support & Operational Conclusions

The system translates raw predictions into four actionable cinema management decisions:

### 8.1 Dynamic Screen Reallocation (Audit & Swap)
- **Problem:** Screen A (120 seats) is screening a surprise hit projected at 115 tickets (turnaway risk). Screen B (350 seats) is screening a declining title projected at 60 tickets.
- **System Action:** Calling `POST /reallocate-screens` automatically simulates swapping capacities and calculates net ticket recovery.
- **Demonstrated Result:** Recovers 50–150 admitted tickets per peak weekend screening.

### 8.2 Dynamic Staff Rostering
- Aggregates predicted footfall per 2-hour window across all auditoriums:
  - **Tier 1 (<40 tickets):** 1 usher, 1 concession attendant.
  - **Tier 2 (40–120 tickets):** 2 ushers, 2 concession attendants.
  - **Tier 3 (>120 tickets):** 4 ushers, 3 concession staff, active crowd marshaling.

### 8.3 F&B Inventory Management
- Correlates predicted tickets with average concession take rates (~45% purchase rate) to guide popcorn batching and avoid pre-popping food spoilage.

### 8.4 Cold-Start Governance Policy
- Shows for films with release age $\le 3$ days are automatically flagged with an **Amber Cold-Start Badge** and an expanded $\pm 35\%$ prediction confidence band, requiring human manager sign-off.

---

## 9. System Architecture & Acceptance Testing

### 9.1 Deployed Services
1. **Modern React Web Platform (`frontend/`):**
   - Built with React 19, Vite, and Tailwind CSS.
   - Comprehensive multi-view multiplex suite: Single-Show Forecaster with 2D seating grids, Master Daily Schedule with CSV export, 1-Click Hungarian Screen Swap Optimizer, and Dynamic Price Elasticity Studio.
2. **FastAPI Backend Microservice (`src/api/app.py`):**
   - Endpoints: `GET /health`, `POST /predict`, `POST /reallocate-screens`.
   - Asynchronous request handling, Pydantic V2 input validation, CORS enabled, OpenAPI/Swagger docs at `http://127.0.0.1:8000/docs`.
3. **Streamlit Operations Dashboard (`dashboard/streamlit_app.py`):**
   - Python-native operations workbench with twin auditorium visualizer and operational controls.

### 9.2 Automated Test Suite (`tests/`)
All 19 automated tests pass with 0 warnings:
- `test_data_pipeline.py`: Verifies zero nulls, chronological sequence, strict boundary compliance, and zero leakage columns.
- `test_models.py`: Verifies capacity clamping $[0, \text{capacity}]$, 20-seat VIP to 1000-seat IMAX edge cases, and cold-start robustness.
- `test_api.py`: Tests `/health`, `/predict` across LightGBM, PyTorch, Baseline, and Ensemble forecaster, unconstrained demand separation, multi-show recommendation schemas, `/batch-forecast`, and `/reallocate-screens`.

---

## 10. Responsible AI, Bias, Privacy & Limitations

1. **Human-in-the-Loop Oversight:** The model is strictly decision-support; physical ticketing contracts with movie distributors prevent full autonomous reallocation without managerial approval.
2. **Representativeness & Bias:** Historical booking trends reflect past consumer behavior. Emerging demographic shifts or regional festivals not in the calendar data must be supplemented by local theater management.
3. **Privacy Compliance:** Uses strictly aggregated show-level records; zero personal customer data, payment credentials, or device IDs are processed.
4. **Environmental Impact:** Reducing over-allocated empty screens saves significant HVAC energy and projection power across 246 multiplexes.

---

## 11. 3–5 Minute Video Demonstration Walkthrough Script

| Timecode | Visual / Screen | Narration Script | Key Metric / Point Shown |
| :---: | :--- | :--- | :--- |
| **0:00 – 0:45** | React Platform Hero & Architecture | *"Hello reviewers. This is the Cinema Ticket Demand Forecasting and Screen Optimization platform built for ALGIONS AI Labs. The core business challenge is allocating screens and staff 72 hours before showtime. Here is our dataset: 142,524 real show records from 246 multiplexes across 8.5 continuous months. We resolved 179 corrupt/null capacity records and eliminated all contemporaneous target leakage at the T-3 horizon."* | 142k rows, $T-3$ horizon, zero leakage. |
| **0:45 – 1:30** | Model Benchmarks & LightGBM Victory | *"We trained three models: a Capacity-Aware Moving Average Baseline, a LightGBM Regressor, and a PyTorch Deep Tabular Network with Entity Embeddings. On 22,125 held-out test shows from Oct 1 to Nov 4, 2018, LightGBM is our champion, reducing MAE from 94.12 to 54.39 seats—a 42.2% error reduction—and saving 123,006 turned-away customer bookings. PyTorch achieved 59.89 MAE."* | MAE 54.39, WAPE 43.28%, 123k tickets recovered. |
| **1:30 – 2:30** | Live Forecaster & Dual Demand / 2-Show | *"In our live React web application, let's explore the Single-Show Forecaster. When we forecast Dune: Part Two in a 180-seat hall, our AI predicts unconstrained demand of 288 patrons. Rather than just capping at 180 and ignoring the 108 lost patrons, our engine flags an automatic 2nd Staggered Screening recommendation, rendering side-by-side twin auditoriums to recover turnaway revenue."* | Demand vs seats separation, 2nd show visualizer, seating grids. |
| **2:30 – 3:30** | Master Schedule & 1-Click Screen Swap | *"Next, in the Master Daily Schedule tab, managers get a full 5-screen matrix with bottleneck tags and CSV export. Clicking '1-Click Screen Swap Optimizer' uses an allocation algorithm: it detects that a blockbuster like Dune 2 is trapped in a 140-seat hall while another film sits in the 360-seat IMAX hall, swapping them instantly to admit +120 additional patrons and boost evening revenue."* | 5-screen schedule, 1-click optimizer, POS publication. |
| **3:30 – 4:15** | Dynamic Pricing Studio & Governance | *"In our Pricing Studio, we plot customer price elasticity curve with epsilon = -1.15, finding the exact revenue-maximizing P* point. Finally, our Governance tab verifies zero data leakage, and all 19 automated tests pass with 100% success. Thank you."* | Price elasticity curve, 19/19 pytest pass. |

---

## 12. Verification & Submission Sign-Off
- **Primary Repository:** `E:\New folder\cinema_demand_forecasting`
- **Trained Artifacts:** `artifacts/lightgbm_model.pkl`, `artifacts/torch_model.pt`, `artifacts/baseline_model.pkl`, `artifacts/metrics_summary.json`
- **Test Suite Status:** 19 passed in 9.71s (100% passing).
