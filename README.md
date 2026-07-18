# ✈️ TravelPilot AI

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangGraph-1C3C5A?style=for-the-badge&logo=chainlink&logoColor=white" alt="LangGraph" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Groq-F55050?style=for-the-badge&logo=groq&logoColor=white" alt="Groq Llama 3" />
</p>

### 🌟 "Your Intelligent Multi-Agent Travel Planner"

TravelPilot AI is a modern, premium, and fully responsive travel planning platform designed with a sleek glassmorphism aesthetic. It utilizes a state-of-the-art **Multi-Agent LangGraph workflow** on a FastAPI backend, communicating with a React + TypeScript frontend to create a seamless "ChatGPT meets Airbnb" planning experience.

---

## 🎨 User Interface & Aesthetics

*   **Glassmorphic Design**: Tailored HSL dark colors, sleek blur panels, glowing interactive components, and smooth hover micro-animations.
*   **Live Execution progress Monitor**: A right-side panel displays real-time step transitions and execution progress for each agent node (Flight, Hotel, Itinerary, Finalizer) via **Server-Sent Events (SSE)**.
*   **Adaptive Theme**: Permanently defaulted to an elegant dark theme for premium contrast.
*   **Dynamic Sidebar History**: Quick access to past itineraries with individual delete icons to keep history tidy.
*   **Responsive Panels**: Beautifully adapts between sidebars, central chat cards, and timelines for desktops and mobile screens.

---

## 📐 Agent Orchestration Architecture

TravelPilot AI splits travel planning into isolated, specialized sub-agents orchestrated by **LangGraph** in a concurrent execution tree:

```mermaid
graph TD
    START([User Message]) --> Extractor[Extractor Agent]
    Extractor --> Check{Parameters Present?}
    
    Check -- No (Short-circuit in 0.4s) --> ItineraryMissing[Itinerary Agent: Request Details]
    ItineraryMissing --> Final[Final Response Node]
    
    Check -- Yes (Concurrently in Parallel) --> Flight[Flight Agent]
    Check -- Yes (Concurrently in Parallel) --> Hotel[Hotel Agent]
    
    Flight --> Itinerary[Itinerary Agent]
    Hotel --> Itinerary
    
    Itinerary --> Final
    Final --> END([SSE Stream to React Client])
    
    style Flight fill:#0f172a,stroke:#38bdf8,stroke-width:2px
    style Hotel fill:#0f172a,stroke:#38bdf8,stroke-width:2px
    style Extractor fill:#1e1b4b,stroke:#818cf8,stroke-width:2px
    style ItineraryMissing fill:#7f1d1d,stroke:#f87171,stroke-width:2px
```

### Nodes Description:
1.  **Extractor Agent (Entry)**: Scans user prompts using LLMs to capture departure city, destination, dates, and days count in a single pass.
2.  **Validation Short-Circuit**: If parameters are missing, the graph immediately skips flights/hotels and routes to the request block, responding in **400ms** on the client side (bypassing server calls entirely when possible).
3.  **Parallel Engines**: Flight and Hotel agents run concurrently to fetch details from Aviationstack and Tavily Search.
4.  **Consolidation**: The Itinerary Agent takes the parallel outputs and structures a day-by-day slot agenda (Morning, Afternoon, Evening).
5.  **Fast JSON Parsing**: The server formats final textual responses using the high-speed `llama3-8b-8192` model (under 0.4s) to assemble structured profiles.

---

## 📂 Repository Structure

```
├── main.py                 # LangGraph workflow, State definition, and Agent nodes
├── server.py               # FastAPI server hosting SSE planning stream
├── tools/                  # Custom tools for flights and search
│   ├── flight_tools.py     # Aviationstack API IATA airport matching & search
│   └── tavily_tool.py      # Tavily search wrapper for accommodation reviews
├── frontend/               # React client application
│   ├── src/
│   │   ├── App.tsx         # Main container, localStorage hook sync, client-side validation
│   │   ├── components/     # UI elements (Sidebar, Navbar, AgentPanel, ChatArea)
│   │   └── types.ts        # TypeScript typings for trips, flights, hotels
└── README.md               # Documentation
```

---

## 🚀 Getting Started

### 1. Database Setup
A PostgreSQL instance is used as the state checkpointer for LangGraph threads. Ensure you have a running PostgreSQL database:
```sql
CREATE DATABASE travelpilot;
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key
AVIATIONSTACK_API_KEY=your_aviationstack_key
TAVILY_API_KEY=your_tavily_search_key
DATABASE_URL=postgresql://username:password@localhost:5432/travelpilot
```

### 3. Backend Launch
```bash
# Initialize Virtual Environment
python3 -m venv venv
source venv/bin/activate

# Install Core packages
pip install fastapi uvicorn pydantic psycopg langchain langchain-groq langgraph python-dotenv

# Run Server
python3 server.py
```
FastAPI runs on `http://localhost:8080`.

### 4. Frontend Launch
```bash
cd frontend
npm install
npm run dev
```
Dev client runs on `http://localhost:5173`.

---

## 🔒 License
Private Repository - Proprietary code. Designed for TravelPilot AI presentations.

---

## 👤 Author

**Om Bansal**  
*   **GitHub**: [@om0710](https://github.com/om0710)
*   **LinkedIn**: [https://www.linkedin.com/in/om-bansal-78420430a/](https://www.linkedin.com/in/om-bansal-78420430a/)
