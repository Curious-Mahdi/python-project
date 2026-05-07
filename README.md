
# 🏏 SportsMassive: IPL Intelligence & Strategy Hub

> "Every ball. Every stat. Every story."

SportsMassive is a professional-grade desktop application built to transform raw, ball-by-ball IPL data into actionable scouting intelligence. Developed as an end-to-end full-stack platform, it moves beyond basic statistical dashboards to offer predictive analytics, head-to-head battle simulations, and AI-driven match narratives.

## ✨ Core Features

*   **Scout's Watchlist (User Auth):** Secure login system allowing users to save their favorite players and generate live form reports comparing current season stats against career averages.
*   **Head-to-Head Battle Simulator:** Select any batsman and bowler to generate a visual breakdown of their historical encounters, highlighting strike rates, dismissal types, and danger zones.
*   **Interactive Visualizations:** High-fidelity Worm and Manhattan charts mapped with critical event markers (e.g., wickets, massive overs).
*   **AI Season Predictor:** Utilizes historical data to predict the top 3 run-scorers for upcoming fixtures.
*   **AI Match Narratives:** Integrates Gemini 1.5 Pro to generate contextual, natural-language scouting reports (e.g., analyzing a batter's weakness against left-arm pace).
*   **Export Center:** One-click functionality to export match and player strategy reports into shareable PDFs.

## 🛠️ Technology Stack

**Frontend (The Command Center):**
*   React.js / Next.js
*   Tailwind CSS (Dark Midnight Navy theme with Electric Blue accents)
*   Recharts & Custom SVGs (Data Visualization)
*   Framer Motion (UI Animations)
*   Lucide React (Iconography)

**Backend (The Engine):**
*   Python & Flask
*   SQLite (Database management for historical Cricsheet data)
*   Pandas (Data manipulation and CSV ingestion)

**Artificial Intelligence:**
*   Gemini 1.5 Pro API (Strategy generation & narrative insights)

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)
*   API Key for Gemini (Google AI Studio)

### Backend Setup (Flask)
1. Navigate to the backend directory:
   ```bash
   cd backend
