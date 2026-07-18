# ✈️ TravelPilot AI

> **Your Intelligent Multi-Agent Travel Planner**
>
> A modern, premium, responsive travel planning application designed with a glassmorphism theme. Built on a multi-agent backend architecture using FastAPI, LangGraph, and PostgreSQL, linked to a React + TypeScript frontend.

---

## 🌟 Key Features

*   **ChatGPT meets Airbnb UI**: Clean, minimal, futuristic dark mode interface with glassmorphism panels, micro-animations, and full responsiveness.
*   **Multi-Agent Collaborative System**: Powered by LangGraph agents executing specialized sub-tasks:
    *   **Extractor Agent**: Automatically scans queries to pull departure, destination, travel dates, and days count in a single pass.
    *   **Flight Agent & Hotel Agent**: Run in parallel concurrently to query real-time flights via Aviationstack and top accommodation lists via Tavily.
    *   **Itinerary Agent**: Generates detailed, day-by-day slot schedules (Morning, Afternoon, Evening).
    *   **Final Agent**: Dynamically compiles the consolidated package in-memory.
*   **Instant Missing Parameter Validation**: Client-side validation automatically short-circuits queries missing vital details (like departure city or dates), prompting the user in less than **400ms** without wasting LLM tokens or hit network lag.
*   **SSE Agent Progress Streaming**: Server-Sent Events (SSE) stream the real-time completion status and progress logs of each backend agent node directly to the frontend's visual progress cards.
*   **Thread & Chat Persistence**: Sessions, sidebar previous trips history, message chains, active selections, and dark mode state are synced with `localStorage` to survive browser page refreshes.
*   **Manageable Conversations**: Users can delete previous planning threads directly from the sidebar history panel with single-click trash controls.
*   **High-Fidelity Offline Fallback**: Dynamically executes high-fidelity client-side simulations if backend API services hit rate limits or are offline.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 18, TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **Icons & Motion**: Lucide React, Framer Motion

### Backend & AI Orchestration
*   **Framework**: FastAPI, Python 3.13
*   **Agent framework**: LangGraph, LangChain
*   **LLM Providers**: Groq (`llama-3.3-70b-versatile` for planning, `llama3-8b-8192` for fast formatting)
*   **Database (Checkpointer)**: PostgreSQL (via `psycopg` and `PostgresSaver`)
*   **External APIs**: Aviationstack API, Tavily Search API

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   PostgreSQL Database instance

### 1. Backend Setup

Clone the repository and navigate to the backend directory:
```bash
# Set up virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pydantic psycopg langchain langchain-groq langgraph python-dotenv
```

Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key
AVIATIONSTACK_API_KEY=your_aviationstack_key
TAVILY_API_KEY=your_tavily_search_key
DATABASE_URL=postgresql://username:password@localhost:5432/your_db_name
```

Start the FastAPI backend server:
```bash
python3 server.py
```
The server will start listening at `http://localhost:8080`.

### 2. Frontend Setup

Navigate to the `frontend` folder:
```bash
cd frontend

# Install Node modules
npm install

# Run the dev server
npm run dev
```
The frontend will start running at `http://localhost:5173`.

---

## 📐 Architecture & Parallel Flow

```mermaid
graph TD
    START([User Message]) --> Extractor[Extractor Agent]
    Extractor --> Check{Details Present?}
    
    Check -- No --> ItineraryMissing[Itinerary Agent: Ask for Info]
    ItineraryMissing --> Final[Final Response]
    
    Check -- Yes --> Flight[Flight Agent]
    Check -- Yes --> Hotel[Hotel Agent]
    
    Flight --> Itinerary[Itinerary Agent]
    Hotel --> Itinerary
    
    Itinerary --> Final
    Final --> END([Render in UI])
    
    style Flight fill:#1e293b,stroke:#0ea5e9,stroke-width:2px
    style Hotel fill:#1e293b,stroke:#0ea5e9,stroke-width:2px
```

---

## 🔒 License
Private Repository - Proprietary code. Designed for TravelPilot AI presentations.
