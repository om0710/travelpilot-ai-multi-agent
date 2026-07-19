import os
from typing import TypedDict , Annotated
import operator
import psycopg

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver

from langchain_core.messages import (
    AnyMessage,
    HumanMessage,
    AIMessage,
    SystemMessage,
)
from langchain_groq import ChatGroq
from tools.tavily_tool import tavily_search
from tools.flight_tools import search_flights
from dotenv import load_dotenv
load_dotenv()
from langchain_groq import ChatGroq

print("DEBUG: GROQ_API_KEY present in main.py:", os.environ.get('GROQ_API_KEY') is not None)
if os.environ.get('GROQ_API_KEY'):
    print("DEBUG: GROQ_API_KEY length in main.py:", len(os.environ.get('GROQ_API_KEY')))

llm = ChatGroq(
    model="llama-3.3-70b-versatile"
)
DATABASE_URL = os.getenv("DATABASE_URL")

class TravelState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    user_query: str
    departure: str
    destination: str
    dates: str
    days: int
    flight_results: str
    hotel_results: str
    itinerary: str
    llm_calls: int

def extract_details(query: str) -> dict:
    import json
    import re
    prompt = f"""
    Analyze this travel request: "{query}"
    Identify if the user has specified:
    1. Departure city or airport code (where they will fly FROM).
    2. Destination city or country (where they will travel TO).
       *IMPORTANT*: If the user does not specify a destination, but explicitly asks you to choose, suggest, recommend, decide, or says "according to you", "you choose", "surprise me", "anywhere", then choose a popular travel destination (like "Rome, Italy", "Tokyo, Japan", "Paris, France", or "Jaipur, India") and set it as the "destination". Do NOT return null in this case.
    3. Exact travel dates or start date.
    4. Number of days of the trip (default to 3 if not specified). *IMPORTANT*: Calculate the exact number of days of the trip from the date range if specified (for example, "23 to 29 August" is 7 days).
    
    Respond ONLY in raw JSON matching this structure:
    {{
      "departure": "city name or null",
      "destination": "city/country name or null",
      "dates": "dates or null",
      "days": number of days
    }}
    """
    res = llm.invoke([HumanMessage(content=prompt)])
    text = res.content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n|```$", "", text, flags=re.MULTILINE).strip()
    s = text.find('{')
    e = text.rfind('}')
    if s != -1 and e != -1:
        return json.loads(text[s:e+1])
    raise ValueError(f"Failed to parse JSON response from LLM: {text}")

def extractor_agent(state: TravelState):
    # Retrieve all human message contents to form a complete consolidated context
    user_messages = [msg.content for msg in state.get("messages", []) if isinstance(msg, HumanMessage) or (hasattr(msg, 'type') and msg.type == 'human')]
    query = state.get("user_query", "")
    if query and query not in user_messages:
        user_messages.append(query)
    
    combined_query = " | ".join(user_messages) if user_messages else query
    details = extract_details(combined_query)
    return {
        "departure": details.get("departure") or state.get("departure"),
        "destination": details.get("destination") or state.get("destination"),
        "dates": details.get("dates") or state.get("dates"),
        "days": details.get("days") or state.get("days") or 3
    }

def flight_agent(state :TravelState ):
    if not state.get("departure") or not state.get("destination") or not state.get("dates"):
        return {
            "flight_results": "MISSING_INFO",
            "messages": [
                AIMessage(content="Waiting for departure/destination/dates inputs...")
            ]
        }
    
    # Query flights from departure city to destination
    flight_data = search_flights(f"from {state['departure']} to {state['destination']}")
    
    return {
        "flight_results": flight_data,
        "messages": [
            AIMessage(content="Flight results fetched")
        ]
    }

def hotel_agent(state :TravelState ):
    if not state.get("departure") or not state.get("destination") or not state.get("dates"):
        return {
            "hotel_results": "MISSING_INFO",
            "messages": [
                AIMessage(content="Waiting for details...")
            ]
        }
        
    dest = state.get("destination") or "your destination"
    
    # Query hotels ONLY in the clean destination city
    hotel_results = tavily_search(f"best luxury and mid-range hotels in {dest}")
    return {
        "hotel_results" : hotel_results,
        "messages": [
            AIMessage(content="hotel information fetched")
        ]
    }

def itinerary_agent(state: TravelState):
    if state.get("flight_results") == "MISSING_INFO" or state.get("hotel_results") == "MISSING_INFO":
        missing = []
        if not state.get("departure"):
            missing.append("departure city (where you will fly from)")
        if not state.get("destination"):
            missing.append("destination city (where you plan to travel)")
        if not state.get("dates"):
            missing.append("travel dates (when you plan to travel)")
            
        missing_str = " and ".join(missing)
        prompt = f"The user wants to plan a trip, but did not specify their {missing_str}. Write a polite, helpful response asking them to provide these details before we can search flights and plan."
        response = llm.invoke([HumanMessage(content=prompt)])
        return {
            "itinerary": response.content,
            "messages": [response]
        }

    dest = state.get("destination") or "your destination"
    days = state.get("days", 3)

    # Generate itinerary specifically for dest and days
    prompt = f"""
    Create a detailed travel itinerary for a {days}-day trip to {dest}.
    
    Flight Results:
    {state['flight_results']}
    
    Hotel Results:
    {state['hotel_results']}
    
    INSTRUCTIONS:
    1. The itinerary MUST be for {dest} only. Do not suggest sightseeing in other cities unless they are adjacent/day-trips.
    2. Create the itinerary for EXACTLY {days} days.
    3. Organize into Day 1, Day 2, etc. split into Morning, Afternoon, Evening slots.
    """
    response = llm.invoke([
        SystemMessage(
            content = "you are expert travel planner"
        ),
        HumanMessage(content=prompt)
    ])

    return {
        "itinerary" : response.content,
        "messages" : [response]
    }

def final_agent(state: TravelState):
    if state.get("flight_results") == "MISSING_INFO":
        return {
            "messages": [AIMessage(content=state["itinerary"])]
        }
        
    final_text = f"""
### Consolidated Travel Plan

#### Flights:
{state['flight_results']}

#### Hotels:
{state['hotel_results']}

#### Detailed Itinerary:
{state['itinerary']}
"""
    return {
        "messages" : [AIMessage(content=final_text.strip())]
    }

graph = StateGraph(TravelState)
graph.add_node("extractor_agent", extractor_agent)
graph.add_node("flight_agent" , flight_agent)
graph.add_node("hotel_agent" , hotel_agent)
graph.add_node("itinerary_agent" , itinerary_agent)
graph.add_node("final_agent" , final_agent)

# Parallel execution of flight and hotel agents after extractor
graph.add_edge(START, "extractor_agent")
graph.add_edge("extractor_agent", "flight_agent")
graph.add_edge("extractor_agent", "hotel_agent")
graph.add_edge("flight_agent", "itinerary_agent")
graph.add_edge("hotel_agent", "itinerary_agent")
graph.add_edge("itinerary_agent", "final_agent")
graph.add_edge("final_agent", END)

if __name__ == "__main__":
    import uuid
    
    print("\n=== Multi-Agent Travel Planner ===")
    thread_id = input("Enter thread ID (or press Enter to create a new session): ").strip()
    if not thread_id:
        thread_id = str(uuid.uuid4())[:8]
        print(f"Created new thread ID: {thread_id}")
    
    config = {"configurable": {"thread_id": thread_id}}
    
    with psycopg.connect(DATABASE_URL) as conn:
        checkpointer = PostgresSaver(conn)
        checkpointer.setup()
        
        workflow = graph.compile(checkpointer=checkpointer)
        
        existing_state = workflow.get_state(config)
        
        if existing_state and existing_state.values.get("messages"):
            print("\n--- Previous Conversation in this Thread ---")
            for msg in existing_state.values["messages"]:
                role = "AI" if isinstance(msg, AIMessage) else "User"
                if msg.content not in ["Flight results fetched", "hotel information fetched"]:
                    print(f"{role}: {msg.content}")
            print("-------------------------------------------\n")
            
        user_query = input("Ask a question or provide new travel details: ").strip()
        if user_query:
            initial_state = {
                "user_query": user_query,
                "messages": [HumanMessage(content=user_query)]
            }
            
            print("\nGenerating your travel plan, please wait...")
            result = workflow.invoke(initial_state, config=config)
            
            final_response = result["messages"][-1].content
            print("\n=== Travel Assistant Response ===")
            print(final_response)
