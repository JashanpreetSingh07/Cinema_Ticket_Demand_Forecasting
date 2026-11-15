# 3–5 Minute Video Walkthrough Script & Interview Defense Guide
**Algions AI Labs Private Limited | Assessment: Cinema Ticket Demand Forecasting**

---

## 1. 3–5 Minute Video Submission Script

> **Tip for Recording:** Use OBS Studio, Loom, or Screen Studio to record your screen while speaking clearly. Have `http://localhost:5173` open in one tab and `http://127.0.0.1:8000/docs` in another.

### Scene 1: Introduction & Problem Formulation (0:00 – 0:45)
- **What to show on screen:** Home screen of the React UI (`http://localhost:5173`) on the *Forecaster* tab.
- **What to say:**
  > *"Hello, my name is [Your Name], and this is my submission for the Cinema Ticket Demand Forecasting project for Algions AI Labs. 
  > The core business goal is providing cinema general managers with actionable decision support 72 hours prior to showtime ($T-3$ days) to optimize two high-stakes operations:
  > First, dynamic screen reallocations—moving high-demand movies into large auditoriums before public booking surges to recapture turned-away customer loss.
  > Second, lobby labor rostering and concession staging—predicting aggregate footfall per show to avoid long lines or wasted F&B inventory."*

### Scene 2: Data Hygiene, Leakage Audit & Chronological Split (0:45 – 1:30)
- **What to show on screen:** Switch tab to *Audit & Models* in the UI or open `notebooks/01_eda_and_leakage_analysis.ipynb`.
- **What to say:**
  > *"We trained and evaluated across 142,524 real screening records from 246 multiplexes and 48 movies.
  > A critical requirement of this project is strict zero-contemporaneous leakage: columns like `total_sales`, `occu_perc`, and `tickets_out` directly leak same-day ticket revenue. We quarantined those completely.
  > All rolling features, price elasticity indices, and cinema momentum are calculated strictly at $t \le T-3$ days.
  > Furthermore, instead of random train-test splitting which causes future-to-past lookahead leakage, we enforced a strict chronological partition: Training from February to August 2018, Validation in September, and an untouched held-out Test set of over 22,000 shows across October and November 2018."*

### Scene 3: Model Architecture & Multi-Show Separation (1:30 – 2:45)
- **What to show on screen:** Switch back to *Forecaster*. Select *Dune: Part Two*, change capacity to *200 seats*, time slot to *19:15 Prime*, and screen format to *IMAX Laser 3D*.
- **What to say:**
  > *"We evaluated three distinct tiers: a capacity-adjusted historical Moving Average baseline, a PyTorch Deep Tabular Network with Entity Embeddings, and our champion LightGBM GBDT regressor, as well as a production Stacking Ensemble blending both.
  > Notice a critical architectural innovation: Unconstrained Demand ($D$) is tracked separately from physical screen capacity ($C$).
  > Here, unconstrained customer demand for Dune 2 on Friday evening is 265 patrons. Because the auditorium holds only 200 seats, standard systems would simply truncate to 200 and ignore the 65 turned-away fans.
  > Our system detects that spillover demand exceeds 30 tickets, and automatically recommends a 2nd Staggered Screening (+30 minutes stagger in an adjacent hall), recapturing +$1,170 in lost ticket gross."*

### Scene 4: Parameter Dynamics & Operational Directives (2:45 – 3:45)
- **What to show on screen:** Move the ticket price slider from $18 to $24, then change weather to *Rainstorm Surge*. Scroll down to show the *F&B Concessions* and *Staffing Roster* cards.
- **What to say:**
  > *"The platform incorporates continuous empirical price elasticity ($\epsilon = -0.65$): every dollar change smoothly shifts demand.
  > In addition to ticket predictions, the system delivers direct operational conclusions:
  > It forecasts F&B concession revenue, tells the kitchen exactly how many popcorn tubs and fountain sodas to pre-batch 40 minutes before showtime, and schedules the exact number of ushers and cleaning crew needed."*

### Scene 5: Acceptance Tests & API Verification (3:45 – 4:30)
- **What to show on screen:** Switch to `http://127.0.0.1:8000/docs`, show `/predict` and `/batch-forecast`, and terminal with `pytest` passing 19/19 tests.
- **What to say:**
  > *"All predictions are powered by real serialized model artifacts through our production FastAPI backend.
  > The system has 19 automated unit and integration tests passing in pytest, ensuring physical seating boundary constraints, cold-start shrinkage, and zero data leakage.
  > Thank you for reviewing my project!"*

---

## 2. 15-Minute Technical Walkthrough & Live Interview Defense

During the interview, technical reviewers will probe your understanding. Here are the exact questions and model answers:

### Q1: "Why did you use WAPE instead of standard MAPE or RMSE as your primary metric?"
- **Answer:**
  > *"In cinema ticket booking, many off-peak or morning shows have near-zero or single-digit ticket sales. Standard MAPE divides by actual sales ($y$), causing catastrophic division-by-zero or massive percentage distortions on small numbers. 
  > WAPE (Weighted Absolute Percentage Error), defined as $\frac{\sum |y - \hat{y}|}{\sum y}$, weights errors proportionally to total volume, which directly reflects commercial business reality.
  > We pair WAPE with MAE (direct seat error) and RMSE (to penalize large misallocations)."*

### Q2: "How did you ensure physical seating capacity is never violated?"
- **Answer:**
  > *"Standard regression algorithms can predict negative tickets or 400 tickets in a 100-seat room. 
  > In LightGBM, we separate the unconstrained latent demand model from physical admitted tickets by applying capacity clamping: $\hat{y}_{\text{admitted}} = \min(\text{capacity}, \max(0, \hat{y}))$.
  > In PyTorch TabularNet, we built a scaled sigmoid output layer: $\hat{y} = \text{capacity} \times \sigma(z)$, mathematically guaranteeing predictions stay strictly in the interval $[0, \text{capacity}]$."*

### Q3: "What constitutes future leakage in this dataset, and how did you prevent it?"
- **Answer:**
  > *"In `cinemaTicket_Ref.csv`, columns like `total_sales` ($S = y \times P$), `occu_perc` ($y / \text{capacity}$), and `tickets_out` directly calculate same-day ticket revenue at showtime. Using any of them to predict $y$ is circular leakage.
  > Secondly, random train/test splits leak future movie popularity back into the past.
  > We solved this by:
  > 1. Quarantining all contemporaneous sales columns.
  > 2. Establishing a strict $T-3$ day prediction cutoff for all rolling lags and cinema footfall metrics.
  > 3. Enforcing a chronological train/val/test split."*

### Q4: "How does the model handle cold-start movies with no history?"
- **Answer:**
  > *"When a brand new film opens ($\le 3$ days of history), film-specific trailing lags are unavailable. 
  > If left unhandled, models either crash on NaN or fail. 
  > We implemented hierarchical empirical Bayesian shrinkage: when film age is $\le 3$ days, the system falls back to cinema-level baseline footfall, genre popularity priors, and capacity tiers, while flagging the prediction with an expanded 90% confidence uncertainty interval to advise human manager review."*

---

## 3. 10-Minute Live Debugging / Code Change Task Prep

Interviewers often ask you to modify the code on the fly during the technical round. Here are the 3 most common tasks and where to make the change:

### Task 1: "Change the price elasticity parameter from -0.65 to -0.80"
- **File:** `src/api/app.py`
- **Location:** Line 279: `PRICE_ELASTICITY = -0.65` $\to$ change to `-0.80`.

### Task 2: "Add an extra 5% penalty for late night shows (Slot 4)"
- **File:** `src/api/app.py`
- **Location:** Line 325: `slot_weights = {1: 0.75, 2: 1.05, 3: 1.48, 4: 1.10}` $\to$ change `4: 1.05`.

### Task 3: "Change the multi-show trigger threshold from 30 seats to 20 seats"
- **File:** `src/api/app.py`
- **Location:** Line 345: `multi_show_recommended = bool(spillover_demand >= 30 ...)` $\to$ change `>= 20`.
