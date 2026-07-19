import os
import json
import re

print("DEBUG: GROQ_API_KEY present in server.py (start):", os.environ.get('GROQ_API_KEY') is not None)
print("DEBUG: All available environment keys:", list(os.environ.keys()))
if os.environ.get('GROQ_API_KEY'):
    print("DEBUG: GROQ_API_KEY length in server.py:", len(os.environ.get('GROQ_API_KEY')))

import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage, SystemMessage

# Import from main.py
from main import graph, llm
from langchain_groq import ChatGroq

fast_llm = ChatGroq(model="llama3-8b-8192")

app = FastAPI(title="TravelPilot AI - Multi-Agent Backend Server")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")

from fastapi.responses import HTMLResponse

@app.get("/", response_class=HTMLResponse)
def root():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>TravelPilot AI Backend</title>
        <style>
            body {
                background-color: #0b0f19;
                color: #f8fafc;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            .card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border-radius: 24px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                max-width: 400px;
            }
            .status-dot {
                width: 12px;
                height: 12px;
                background-color: #10b981;
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
                box-shadow: 0 0 12px #10b981;
                animation: pulse 2s infinite;
            }
            .status-container {
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.2);
                border-radius: 12px;
                padding: 8px 16px;
                margin-top: 20px;
                font-size: 14px;
                color: #34d399;
                font-weight: 600;
            }
            h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 800;
                background: linear-gradient(to right, #38bdf8, #6366f1);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            p {
                color: #94a3b8;
                font-size: 14px;
                line-height: 1.5;
            }
            @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>TravelPilot AI</h1>
            <p>Multi-Agent Orchestrator backend server is successfully deployed and running on Railway.</p>
            <div class="status-container">
                <span class="status-dot"></span>
                SYSTEM ONLINE
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

class PlanRequest(BaseModel):
    query: str
    thread_id: str

@app.post("/api/plan")
def plan_trip(req: PlanRequest):
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL not set in environment.")

    config = {"configurable": {"thread_id": req.thread_id}}

    def event_generator():
        try:
            with psycopg.connect(DATABASE_URL) as conn:
                checkpointer = PostgresSaver(conn)
                checkpointer.setup()
                workflow = graph.compile(checkpointer=checkpointer)

                # Send initial state updates to UI
                yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'flight', 'progress': 25, 'details': 'Analyzing flight departure and destination codes...'})}\n\n"

                initial_state = {
                    "user_query": req.query,
                    "messages": [HumanMessage(content=req.query)]
                }

                # We iterate over the stream of node completions
                for chunk in workflow.stream(initial_state, config=config, stream_mode="updates"):
                    if "flight_agent" in chunk:
                        flight_res = chunk["flight_agent"].get("flight_results", "")
                        if flight_res == "MISSING_INFO":
                            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'flight', 'progress': 50, 'details': 'Missing critical travel parameters...'})}\n\n"
                        else:
                            yield f"data: {json.dumps({'event': 'agent_complete', 'agent': 'flight', 'details': 'Flight options parsed successfully!'})}\n\n"
                            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'hotel', 'progress': 30, 'details': 'Searching Tavily index for accommodations...'})}\n\n"
                            
                    elif "hotel_agent" in chunk:
                        hotel_res = chunk["hotel_agent"].get("hotel_results", "")
                        if hotel_res == "MISSING_INFO":
                            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'hotel', 'progress': 50, 'details': 'Details incomplete.'})}\n\n"
                        else:
                            yield f"data: {json.dumps({'event': 'agent_complete', 'agent': 'hotel', 'details': 'Accommodations identified successfully!'})}\n\n"
                            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'itinerary', 'progress': 40, 'details': 'Formatting travel timeline slots...'})}\n\n"
                        
                    elif "itinerary_agent" in chunk:
                        yield f"data: {json.dumps({'event': 'agent_complete', 'agent': 'itinerary', 'details': 'Trip scheduling designed successfully!'})}\n\n"
                        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'final', 'progress': 50, 'details': 'Packaging travel response...'})}\n\n"
                        
                    elif "final_agent" in chunk:
                        yield f"data: {json.dumps({'event': 'agent_complete', 'agent': 'final', 'details': 'Response compiled!'})}\n\n"

                # Retrieve the final compiled state to parse it
                state = workflow.get_state(config)
                result_state = state.values
                
                flight_results = result_state.get("flight_results", "")
                hotel_results = result_state.get("hotel_results", "")
                itinerary = result_state.get("itinerary", "")
                final_content = result_state["messages"][-1].content

                # Check if it was MISSING_INFO
                if flight_results == "MISSING_INFO":
                    payload = {
                        "event": "final_result",
                        "content": final_content,
                        "flights": [],
                        "hotels": [],
                        "itinerary": [],
                        "summary": None
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                    return

                # Structured Parsing Prompt for Llama 3
                parser_prompt = f"""
                You are a JSON formatter. Parse the following unstructured travel data from a multi-agent system into a valid JSON object matching the schema below.

                INPUTS:
                - Flight Results: {flight_results}
                - Hotel Search Data: {hotel_results}
                - Travel Itinerary: {itinerary}
                - Final Response: {final_content}

                SCHEMA:
                {{
                  "flights": [
                    {{
                      "id": "1",
                      "airlineLogo": "",
                      "airlineName": "Airline Name",
                      "departure": "DEL",
                      "departureTime": "08:30 AM",
                      "arrival": "Destination Code",
                      "arrivalTime": "04:45 PM",
                      "duration": "6h 15m",
                      "stops": "Direct or 1 Stop",
                      "price": "₹42,800",
                      "status": "Scheduled",
                      "date": "23 Aug 2026"
                    }}
                  ],
                  "hotels": [
                    {{
                      "id": "1",
                      "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400",
                      "name": "Hotel Name",
                      "rating": 4.8,
                      "price": "₹14,500",
                      "amenities": ["Spa", "Pool"],
                      "location": "Downtown, City Name"
                    }}
                  ],
                  "itinerary": [
                    {{
                      "day": 1,
                      "date": "Day 1",
                      "morning": {{ "title": "Morning Activity", "description": "Details", "location": "Location name" }},
                      "afternoon": {{ "title": "Afternoon Activity", "description": "Details", "location": "Location name" }},
                      "evening": {{ "title": "Evening Activity", "description": "Details", "location": "Location name" }}
                    }}
                  ],
                  "summary": {{
                    "destination": "City Name, Country",
                    "budget": "₹80,000 - ₹1,20,000",
                    "bestFlights": "Airlines and prices info",
                    "recommendedHotel": "Top recommended hotel name",
                    "placesToVisit": ["Place 1", "Place 2"],
                    "thingsToCarry": ["Item 1", "Item 2"],
                    "weatherTips": "Weather tip summary",
                    "travelTips": "General travel tip summary"
                  }}
                }}

                RULES:
                1. Return ONLY valid raw JSON.
                2. Do NOT wrap the output in markdown block code syntax (e.g. do NOT output ```json). Just the raw braces.
                3. Fill in reasonable mock details (e.g. generic images/timings/codes/logos) if they are missing from the inputs.
                4. Populate the "date" field in each flight using the user's travel dates (e.g. the first date of the trip).
                5. Do NOT use a hardcoded static price. Generate dynamic, realistic flight prices in INR (₹) matching the flight route (for example, flights between India and Europe/America/Asia should be around ₹45,000 to ₹80,000, while domestic flights within India should be around ₹4,500 to ₹9,500).
                6. Align all hotel details (names, ratings, pricing, amenities) to match the user's budget and style intent in the query. If the user asks for cheap or budget hotels, ensure the parsed hotels are hostels/budget hotels with prices in the range of ₹1,000 to ₹4,000. If they ask for luxury, provide premium 5-star hotels with prices in the range of ₹25,000 to ₹75,000.
                7. Make sure key names match the schema exactly.
                """

                # Ask LLM to format it as JSON
                response = fast_llm.invoke([
                    SystemMessage(content="You are an expert JSON parsing assistant. Always respond with raw valid JSON only."),
                    HumanMessage(content=parser_prompt)
                ])

                # Clean and parse JSON robustly
                json_text = response.content.strip()
                start_idx = json_text.find('{')
                end_idx = json_text.rfind('}')
                
                if start_idx != -1 and end_idx != -1:
                    json_clean = json_text[start_idx:end_idx + 1]
                    parsed_data = json.loads(json_clean)
                else:
                    parsed_data = {}

                # Attach final response text
                parsed_data["event"] = "final_result"
                parsed_data["content"] = final_content

                yield f"data: {json.dumps(parsed_data)}\n\n"

        except Exception as e:
            print(f"Error in stream: {e}")
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    # Bind dynamically to the port provided by Railway/Render
    port = int(os.getenv("PORT", 8080))
    # Disable reload in production container to prevent watch limits
    reload_mode = os.getenv("PORT") is None
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=reload_mode)
