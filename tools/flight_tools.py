import os
import requests
import json
import re
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

load_dotenv()
api_key = os.getenv("AVIATIONSTACK_API_KEY")

def search_flights(query=None):
    url = "http://api.aviationstack.com/v1/flights"

    params = {
        "access_key": api_key,
        "limit": 5
    }

    # Handle query parameter intelligently by using LLM to extract IATA codes
    if query:
        query_clean = str(query).strip().upper()
        
        # 1. Check if it's already a 3-letter IATA code
        if len(query_clean) == 3 and query_clean.isalpha():
            params["arr_iata"] = query_clean
            params["dep_iata"] = "DEL"
        # 2. Check if it's a flight number (e.g. AA123)
        elif len(query_clean) >= 4 and query_clean[:2].isalpha() and query_clean[2:].isdigit():
            params["flight_iata"] = query_clean
        # 3. Resolve using LLM extraction
        else:
            try:
                llm = ChatGroq(model="llama-3.3-70b-versatile")
                prompt = f"""
                Analyze this travel query: "{query}"
                Identify:
                1. The departure city or airport code (where the user starts their journey). If not specified, return "DEL".
                2. The destination city, airport code, or country (where the user is travelling to). If it is a country (like Switzerland), return the IATA code of its busiest international airport (like ZRH for Zurich).
                
                Output a valid JSON object with the keys "dep_iata" and "arr_iata".
                Example: {{"dep_iata": "GWL", "arr_iata": "ZRH"}}
                Return ONLY the raw JSON object and nothing else. No markdown code blocks, no explanation.
                """
                res = llm.invoke([HumanMessage(content=prompt)])
                text = res.content.strip()
                if text.startswith("```"):
                    text = re.sub(r"^```(?:json)?\n|```$", "", text, flags=re.MULTILINE).strip()
                s = text.find('{')
                e = text.rfind('}')
                if s != -1 and e != -1:
                    codes = json.loads(text[s:e+1])
                    dep = codes.get("dep_iata", "DEL").strip().upper()
                    arr = codes.get("arr_iata", "").strip().upper()
                    
                    if len(dep) == 3 and dep.isalpha():
                        params["dep_iata"] = dep
                    if len(arr) == 3 and arr.isalpha():
                        params["arr_iata"] = arr
                else:
                    params["flight_iata"] = query_clean
            except Exception as e:
                print(f"Error resolving flight codes: {e}")
                params["flight_iata"] = query_clean

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        return f"Error connecting to flight API: {str(e)}"

    if "error" in data:
        error_msg = data.get("error", {}).get("message", "Unknown API error")
        return f"API Error: {error_msg}"

    flights = []
    
    if "data" in data and data["data"]:
        for flight in data['data'][:5]:
            airline = flight.get("airline" , {}).get("name" , "unknown")
            departure = flight.get("departure" , {}).get("airport" , "unknown")
            arrival = flight.get("arrival" , {}).get("airport" , "unknown")
            status = flight.get("flight_status" , "unknown")
            flights.append(
                f"Airline: {airline}\n"
                f"Departure: {departure}\n"
                f"Arrival: {arrival}\n"
                f"Status: {status}\n"
            )
        return "\n".join(flights)
    
    return "No flights found matching the criteria."