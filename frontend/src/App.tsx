import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ChatArea } from './components/ChatArea';
import { AgentPanel } from './components/AgentPanel';
import type { AgentStatus, Message, TripHistory, Flight, Hotel, ItineraryDay, TravelSummary } from './types';

// Mock initial history
const INITIAL_HISTORY: TripHistory[] = [
  {
    id: 'trip-1',
    destination: 'Athens & Istanbul',
    date: 'July 18, 2026',
    summary: '9-day multi-city cultural tour'
  },
  {
    id: 'trip-2',
    destination: 'Paris, France',
    date: 'June 05, 2026',
    summary: '5-day romantic leisure getaway'
  }
];

const INITIAL_AGENTS: AgentStatus[] = [
  {
    id: 'flight',
    name: 'Flight Agent',
    status: 'idle',
    description: 'Scans real-time airlines, calculates route duration, layovers, and average pricing matrices.',
    progress: 0
  },
  {
    id: 'hotel',
    name: 'Hotel Agent',
    status: 'idle',
    description: 'Queries available accommodations, reviews traveler ratings, locations, and pricing brackets.',
    progress: 0
  },
  {
    id: 'itinerary',
    name: 'Itinerary Agent',
    status: 'idle',
    description: 'Compiles time-slotted daily activities covering sightseeing, local foods, and routes.',
    progress: 0
  },
  {
    id: 'final',
    name: 'Final Response Agent',
    status: 'idle',
    description: 'Orchestrates results from all sub-agents to construct a premium consolidated travel file.',
    progress: 0
  }
];

function App() {
  const darkMode = true;

  const [previousTrips, setPreviousTrips] = useState<TripHistory[]>(() => {
    const saved = localStorage.getItem('travelpilot_previousTrips');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading saved previousTrips:", e);
      }
    }
    return INITIAL_HISTORY;
  });

  const [activeTripId, setActiveTripId] = useState<string | null>(() => {
    return localStorage.getItem('travelpilot_activeTripId');
  });
  
  // Real chat history storage map per thread ID
  const [tripsConversations, setTripsConversations] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('travelpilot_tripsConversations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading saved tripsConversations:", e);
      }
    }
    // Seed initial history conversations
    return {
      'trip-1': [
        {
          id: 'msg-1-1',
          sender: 'user',
          content: 'Plan a trip to Athens & Istanbul',
          timestamp: 'July 18, 2026'
        },
        {
          id: 'msg-1-2',
          sender: 'ai',
          content: 'Here is the custom multi-agent travel plan structured for your journey to Athens & Istanbul.',
          timestamp: 'July 18, 2026',
          flights: getMockFlights('Athens & Istanbul'),
          hotels: getMockHotels('Athens & Istanbul'),
          itinerary: getMockItinerary('Athens & Istanbul'),
          summary: getMockSummary('Athens & Istanbul')
        }
      ],
      'trip-2': [
        {
          id: 'msg-2-1',
          sender: 'user',
          content: 'Plan a trip to Paris, France',
          timestamp: 'June 05, 2026'
        },
        {
          id: 'msg-2-2',
          sender: 'ai',
          content: 'Here is the custom romantic itinerary and flight check for your Paris trip.',
          timestamp: 'June 05, 2026',
          flights: getMockFlights('Paris, France'),
          hotels: getMockHotels('Paris, France'),
          itinerary: getMockItinerary('Paris, France'),
          summary: getMockSummary('Paris, France')
        }
      ]
    };
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [agents, setAgents] = useState<AgentStatus[]>(INITIAL_AGENTS);
  const [currentTripName, setCurrentTripName] = useState<string>('TravelPilot AI Planner');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // open on desktop, closed on mobile by default
    }
    return true;
  });

  // Load theme preference and save
  useEffect(() => {
    localStorage.setItem('travelpilot_darkMode', String(darkMode));
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist sidebar trips
  useEffect(() => {
    localStorage.setItem('travelpilot_previousTrips', JSON.stringify(previousTrips));
  }, [previousTrips]);

  // Persist active session ID
  useEffect(() => {
    if (activeTripId) {
      localStorage.setItem('travelpilot_activeTripId', activeTripId);
    } else {
      localStorage.removeItem('travelpilot_activeTripId');
    }
  }, [activeTripId]);

  // Persist complete conversation history
  useEffect(() => {
    localStorage.setItem('travelpilot_tripsConversations', JSON.stringify(tripsConversations));
  }, [tripsConversations]);

  // Load conversation when active trip ID changes
  useEffect(() => {
    if (activeTripId && tripsConversations[activeTripId]) {
      setMessages(tripsConversations[activeTripId]);
      const trip = previousTrips.find(t => t.id === activeTripId);
      if (trip) {
        setCurrentTripName(trip.destination);
      }
    } else if (!activeTripId) {
      setMessages([]);
      setCurrentTripName('New Trip Planning');
    }
  }, [activeTripId, tripsConversations, previousTrips]);

  const handleSelectTrip = (id: string) => {
    setActiveTripId(id);
    setSidebarOpen(false);
  };

  const handleNewTrip = () => {
    setActiveTripId(null);
    setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'idle', progress: 0, details: undefined })));
    setSidebarOpen(false);
  };

  const handleDeleteTrip = (id: string) => {
    setPreviousTrips(prev => prev.filter(t => t.id !== id));
    setTripsConversations(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeTripId === id) {
      setActiveTripId(null);
      setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'idle', progress: 0, details: undefined })));
    }
  };

  const handleSelectTemplate = (text: string) => {
    setInputValue(text);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsgText = inputValue;
    setInputValue('');

    const threadId = activeTripId || `trip-${Date.now()}`;
    const userMessage: Message = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      content: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update active trip state immediately
    if (!activeTripId) {
      setActiveTripId(threadId);
      // Create previous trip card template
      setPreviousTrips(prev => [
        {
          id: threadId,
          destination: 'Planning trip...',
          date: new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }),
          summary: 'Pending multi-agent execution'
        },
        ...prev
      ]);
    }

    // Append user message locally
    const currentConvo = [...(tripsConversations[threadId] || []), userMessage];
    setTripsConversations(prev => ({
      ...prev,
      [threadId]: currentConvo
    }));

    // Combine all user messages in this thread to analyze parameters contextually!
    const allUserMessages = currentConvo.filter(m => m.sender === 'user').map(m => m.content);
    const combinedQueryText = allUserMessages.join(" | ").toLowerCase();

    // Check if the user is asking the model to recommend or choose a destination
    const isRecommendationQuery = combinedQueryText.includes("according to you") || 
                                  combinedQueryText.includes("you choose") || 
                                  combinedQueryText.includes("choose for me") || 
                                  combinedQueryText.includes("surprise me") || 
                                  combinedQueryText.includes("anywhere") || 
                                  combinedQueryText.includes("recommend") || 
                                  combinedQueryText.includes("suggest") || 
                                  combinedQueryText.includes("you decide");

    // Extract destination name from the combined query context
    let destination = 'Udaipur'; // default fallback
    const cleanQuery = combinedQueryText;
    if (cleanQuery.includes('tokyo') || cleanQuery.includes('japan')) destination = 'Tokyo, Japan';
    else if (cleanQuery.includes('rome') || cleanQuery.includes('italy')) destination = 'Rome, Italy';
    else if (cleanQuery.includes('paris') || cleanQuery.includes('france')) destination = 'Paris, France';
    else if (cleanQuery.includes('swiss alps') || cleanQuery.includes('switzerland')) destination = 'Swiss Alps';
    else if (cleanQuery.includes('delhi') || cleanQuery.includes('india')) destination = 'Delhi, India';
    else if (cleanQuery.includes('udaipur')) destination = 'Udaipur, India';
    else if (isRecommendationQuery) destination = 'Rome, Italy'; // default recommendation if user leaves it up to us
    else {
      // Find matches for "to [place]" or "for [place]" or "visit [place]"
      const match = cleanQuery.match(/(?:to|for|visit)\s+([A-Za-z\s]+?)(?:\s+of|\s+for|\s+\d+|\s+day|$)/i);
      if (match && match[1] && match[1].trim()) {
        destination = match[1].trim();
        // Capitalize first letters
        destination = destination.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      } else {
        const words = cleanQuery.replace(/[^\w\s]/g, '').split(/\s+/);
        if (words.length > 0) {
          const capWord = words.find(w => w && w.charAt(0) === w.charAt(0).toUpperCase() && w.toLowerCase() !== 'plan' && w.toLowerCase() !== 'trip');
          destination = capWord || words[words.length - 1];
        }
      }
    }

    // Parse number of days from query or calculate from date range (e.g. 23 to 29)
    let daysCount = 3; // Default
    const daysMatch = cleanQuery.match(/(\d+)\s*day/i);
    if (daysMatch && daysMatch[1]) {
      daysCount = parseInt(daysMatch[1]);
    } else {
      // Match range like "23 to 29" or "23 - 29" or "23rd to 29th"
      const rangeMatch = cleanQuery.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|and|until|-|through)\s*(\d{1,2})(?:st|nd|rd|th)?/i);
      if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        if (end > start && end - start < 31) {
          daysCount = end - start + 1; // inclusive days
        }
      }
    }

    setCurrentTripName(destination);

    // Initial streaming message
    const streamingId = `ai-msg-${Date.now()}`;
    const initialAIMessage: Message = {
      id: streamingId,
      sender: 'ai',
      content: 'Connecting to multi-agent orchestrator backend...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    };

    setTripsConversations(prev => ({
      ...prev,
      [threadId]: [...currentConvo, initialAIMessage]
    }));

    // Set up agent animations based on user query intent
    const queryLower = userMsgText.toLowerCase();
    const isFlightQuery = queryLower.includes("flight") || queryLower.includes("fly") || queryLower.includes("departure") || queryLower.includes("from ") || queryLower.includes("ticket") || queryLower.includes("airline");
    const isHotelQuery = queryLower.includes("hotel") || queryLower.includes("stay") || queryLower.includes("accommodation") || queryLower.includes("resort") || queryLower.includes("hostel") || queryLower.includes("room") || queryLower.includes("cheap") || queryLower.includes("budget") || queryLower.includes("luxury");
    const isItineraryQuery = queryLower.includes("itinerary") || queryLower.includes("schedule") || queryLower.includes("plan") || queryLower.includes("day") || queryLower.includes("visit") || queryLower.includes("sightseeing");

    const hasTargetedIntent = isFlightQuery || isHotelQuery || isItineraryQuery;
    
    setAgents(INITIAL_AGENTS.map(a => {
      if (a.id === 'flight') {
        const skip = hasTargetedIntent && !isFlightQuery;
        return { ...a, status: skip ? 'completed' : 'idle', progress: skip ? 100 : 0, details: skip ? 'Retained from cache' : undefined };
      } else if (a.id === 'hotel') {
        const skip = hasTargetedIntent && !isHotelQuery;
        return { ...a, status: skip ? 'completed' : 'idle', progress: skip ? 100 : 0, details: skip ? 'Retained from cache' : undefined };
      } else if (a.id === 'itinerary') {
        const skip = hasTargetedIntent && !isItineraryQuery;
        return { ...a, status: skip ? 'completed' : 'idle', progress: skip ? 100 : 0, details: skip ? 'Retained from cache' : undefined };
      } else {
        return { ...a, status: 'idle', progress: 0, details: undefined };
      }
    }));



    try {
      const apiHost = import.meta.env.VITE_API_URL || 'https://travelpilot-ai-multi-agent.vercel.app';
      const response = await fetch(`${apiHost}/api/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMsgText,
          thread_id: threadId
        })
      });

      if (!response.ok) throw new Error("Backend server error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("No reader available");

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.replace(/^data:\s*/, "").trim();
          if (!cleanLine) continue;

          try {
            const data = JSON.parse(cleanLine);
            if (data.event === "agent_start") {
              updateAgent(data.agent, 'running', data.progress || 30, data.details);
            } else if (data.event === "agent_complete") {
              updateAgent(data.agent, 'completed', 100, data.details);
            } else if (data.event === "final_result") {
              // Mark all agents completed
              setAgents(prev => prev.map(a => ({ ...a, status: 'completed', progress: 100, details: 'Plan assembled!' })));

              const showFlightsOnly = hasTargetedIntent && isFlightQuery && !isHotelQuery && !isItineraryQuery;
              const showHotelsOnly = hasTargetedIntent && isHotelQuery && !isFlightQuery && !isItineraryQuery;
              const showItineraryOnly = hasTargetedIntent && isItineraryQuery && !isFlightQuery && !isHotelQuery;

              const finalAIMessage: Message = {
                id: streamingId,
                sender: 'ai',
                content: data.content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                flights: data.flights,
                hotels: data.hotels,
                itinerary: data.itinerary,
                summary: data.summary,
                showFlightsOnly,
                showHotelsOnly,
                showItineraryOnly
              };

              setTripsConversations(prev => ({
                ...prev,
                [threadId]: [...currentConvo, finalAIMessage]
              }));

              // Update sidebar details with actual destination from LLM
              const actualDest = data.summary?.destination || destination;
              setPreviousTrips(prev => prev.map(t => 
                t.id === threadId 
                  ? { ...t, destination: actualDest, summary: data.summary?.budget || `${daysCount}-day custom itinerary` } 
                  : t
              ));
            } else if (data.event === "error") {
              throw new Error(data.message);
            }
          } catch (e) {
            console.error("Error parsing stream chunk, triggering fallback:", e);
            throw e;
          }
        }
      }
    } catch (err) {
      console.warn("Backend unavailable or streaming failed, running offline custom simulation:", err);
      // Fallback: Run local high-fidelity simulation
      runOfflineSimulation(destination, threadId, streamingId, currentConvo, daysCount, combinedQueryText, userMsgText);
    }
  };

  // Parse departure and destination from the user query text
  const parseQueryCities = (query: string) => {
    let dep = "Delhi";
    let dest = "Jaipur";
    
    const clean = query.toLowerCase();
    
    // Match "departure is [city]" or "departure city is [city]" or "departing from [city]"
    const departureIsMatch = clean.match(/(?:departure\s+city\s+is|departure\s+is)\s+([a-z\s]+?)(?:\s+to|\s+on|\s+for|\band\b|\bdates\b|\bwith\b|\bi\s+plan|\s+plan|\b\d|$)/i);
    
    if (departureIsMatch && departureIsMatch[1]) {
      dep = departureIsMatch[1].trim();
    } else if (clean.includes("from gwl") || clean.includes("from gwalior")) {
      dep = "Gwalior";
    } else if (clean.includes("from mumbai") || clean.includes("from bom")) {
      dep = "Mumbai";
    } else if (clean.includes("from delhi") || clean.includes("from del") || clean.includes("leaving from delhi") || clean.includes("leaving from del")) {
      dep = "Delhi";
    } else if (clean.includes("from tokyo") || clean.includes("from nrt")) {
      dep = "Tokyo";
    } else {
      // General regex search for departure
      const depMatch = clean.match(/(?:from|leaving\s+from|flying\s+from|departing\s+from)\s+([a-z\s]+?)(?:\s+to|\s+on|\s+for|\s+in|\s+at|\band\b|\bdates\b|\bwith\b|\b\d|$)/i);
      if (depMatch && depMatch[1]) {
        dep = depMatch[1].trim();
      }
    }

    // Strip out prepended prepositions like "from "
    if (dep.toLowerCase().startsWith("from ")) {
      dep = dep.slice(5).trim();
    }

    // 2. Identify destination: look for cities in the query, but EXCLUDE the departure city!
    const checkDest = (city: string) => {
      return clean.includes(city) && !dep.toLowerCase().includes(city);
    };

    if (checkDest("tokyo")) dest = "Tokyo, Japan";
    else if (checkDest("paris")) dest = "Paris, France";
    else if (checkDest("rome")) dest = "Rome, Italy";
    else if (checkDest("swiss") || checkDest("switzerland")) dest = "Swiss Alps";
    else if (checkDest("jaipur")) dest = "Jaipur, India";
    else if (checkDest("udaipur")) dest = "Udaipur, India";
    else if (checkDest("delhi")) dest = "Delhi, India";
    else {
      // Fallback: regex matching "to [city]" or "for [city]" or "visit [city]"
      const destMatch = clean.match(/(?:to|for|visit|trip\s+for|trip\s+to)\s+([a-z\s]+?)(?:\s+from|\s+on|\s+for|\s+leaving|\s+flying|\s+\d|$)/i);
      if (destMatch && destMatch[1] && !destMatch[1].includes(dep.toLowerCase())) {
        dest = destMatch[1].trim();
      }
    }
    
    return {
      dep: dep.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      dest: dest.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    };
  };

  // Local Offline fallback simulation with agent step transitions
  const runOfflineSimulation = (dest: string, threadId: string, aiMsgId: string, baseConvo: Message[], daysCount: number, originalQuery?: string, latestQuery?: string) => {
    const query = (originalQuery || "").toLowerCase();
    const lQuery = (latestQuery || originalQuery || "").toLowerCase();
    
    const isFlight = lQuery.includes("flight") || lQuery.includes("fly") || lQuery.includes("departure") || lQuery.includes("from ") || lQuery.includes("ticket") || lQuery.includes("airline");
    const isHotel = lQuery.includes("hotel") || lQuery.includes("stay") || lQuery.includes("accommodation") || lQuery.includes("resort") || lQuery.includes("hostel") || lQuery.includes("room") || lQuery.includes("cheap") || lQuery.includes("budget") || lQuery.includes("luxury");
    const isItinerary = lQuery.includes("itinerary") || lQuery.includes("schedule") || lQuery.includes("plan") || lQuery.includes("day") || lQuery.includes("visit") || lQuery.includes("sightseeing");

    const hasTargeted = isFlight || isHotel || isItinerary;
    const showFlightsOnly = hasTargeted && isFlight && !isHotel && !isItinerary;
    const showHotelsOnly = hasTargeted && isHotel && !isFlight && !isItinerary;
    const showItineraryOnly = hasTargeted && isItinerary && !isFlight && !isHotel;

    const hasDeparture = query.includes("from") || query.includes("departure") || query.includes("departing") || query.includes("leaving") || query.includes("fly");
    const hasDates = query.includes("on ") || query.includes("date") || query.includes("january") || query.includes("february") || query.includes("march") || query.includes("april") || query.includes("may") || query.includes("june") || query.includes("july") || query.includes("august") || query.includes("september") || query.includes("october") || query.includes("november") || query.includes("december") || /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/.test(query) || /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(query) || /(?:202\d)/.test(query) || /\b\d{1,2}\b/.test(query);
    const hasDestination = query.includes("to ") || query.includes("trip for") || query.includes("visit ") || query.includes("jaipur") || query.includes("tokyo") || query.includes("paris") || query.includes("rome") || query.includes("swiss") || query.includes("switzerland") || query.includes("delhi") || query.includes("udaipur") || query.includes("travel");
    
    if (!hasDeparture || !hasDestination || !hasDates) {
      updateAgent('flight', 'failed', 0, 'Missing flight parameters...');
      updateAgent('hotel', 'failed', 0, 'Missing hotel parameters...');
      updateAgent('itinerary', 'completed', 100, 'Awaiting details...');
      updateAgent('final', 'completed', 100, 'Response compiled');
      
      const missingFields: string[] = [];
      if (!hasDeparture) missingFields.push("departure city (where you will fly from)");
      if (!hasDestination) missingFields.push("destination city (where you plan to travel)");
      if (!hasDates) missingFields.push("travel dates (when you plan to travel)");
      
      const missingStr = missingFields.join(" and ");
      
      const finalAIMessage: Message = {
        id: aiMsgId,
        sender: 'ai',
        content: `I would be happy to help you plan your trip! However, to search flights and customize your itinerary, I need you to provide your ${missingStr}. Could you please specify these details?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        showFlightsOnly,
        showHotelsOnly,
        showItineraryOnly
      };

      setTripsConversations(prev => ({
        ...prev,
        [threadId]: [...baseConvo, finalAIMessage]
      }));

      setPreviousTrips(prev => prev.map(t => 
        t.id === threadId 
          ? { ...t, destination: dest || 'Planning trip...', summary: 'Awaiting details...' } 
          : t
      ));
      
      return;
    }

    const { dep, dest: parsedDest } = parseQueryCities(originalQuery || dest);
    updateAgent('flight', 'running', 25, 'Connecting to aviationstack API...');
    
    // Parse flight date from query if specified
    let flightDate = undefined;
    const yearMatch = query.match(/\b(202\d)\b/);
    const year = yearMatch ? yearMatch[1] : "2026";
    
    // 1. Check for range with month at the end, e.g., "from 23 to 29 July" or "23-29 July"
    const rangeWithMonthMatch = query.match(/(?:from|on|between|are)?\s*(\d{1,2})(?:st|nd|rd|th)?(?:\s*to\s*|\s*-\s*|\s*and\s*)(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i);
    
    // 2. Check for start date with month, e.g., "from 23 July to 29 July" or "23 July"
    const startDateMatch = query.match(/(?:on|from|starts|on\s+the|date\s+is)\s*(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i);
    
    // 3. Check for standard numeric format, e.g., "23/07/2026"
    const numericDateMatch = query.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);

    if (rangeWithMonthMatch && rangeWithMonthMatch[1] && rangeWithMonthMatch[3]) {
      const day = rangeWithMonthMatch[1];
      const month = rangeWithMonthMatch[3].charAt(0).toUpperCase() + rangeWithMonthMatch[3].slice(1).toLowerCase();
      flightDate = `${month} ${day}, ${year}`;
    } else if (startDateMatch && startDateMatch[1] && startDateMatch[2]) {
      const day = startDateMatch[1];
      const month = startDateMatch[2].charAt(0).toUpperCase() + startDateMatch[2].slice(1).toLowerCase();
      flightDate = `${month} ${day}, ${year}`;
    } else if (numericDateMatch && numericDateMatch[1] && numericDateMatch[2]) {
      const day = numericDateMatch[1];
      const monthNum = parseInt(numericDateMatch[2]);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[monthNum - 1] || "Jul";
      flightDate = `${month} ${day}, ${year}`;
    } else {
      // Fallback
      const d = new Date();
      d.setDate(d.getDate() + 7);
      flightDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    setTimeout(() => {
      updateAgent('flight', 'running', 70, `Filtering flights from ${dep} to ${parsedDest}...`);
      
      setTimeout(() => {
        updateAgent('flight', 'completed', 100, `Found flights successfully!`);
        
        // Hotel
        updateAgent('hotel', 'running', 30, 'Connecting to Tavily search index...');
        
        setTimeout(() => {
          updateAgent('hotel', 'running', 80, `Evaluating accommodation ratings in ${parsedDest}...`);
          
          setTimeout(() => {
            updateAgent('hotel', 'completed', 100, `Found top hotels!`);
            
            // Itinerary
            updateAgent('itinerary', 'running', 40, 'Structuring travel events...');
            
            setTimeout(() => {
              updateAgent('itinerary', 'running', 85, 'Arranging local sights and timings...');
              
              setTimeout(() => {
                updateAgent('itinerary', 'completed', 100, 'Itinerary compiled!');
                
                // Final
                updateAgent('final', 'running', 50, 'Organizing flight & hotel lists...');
                
                setTimeout(() => {
                  updateAgent('final', 'completed', 100, 'Checkpointer stored successfully!');
                  
                  const isCheapRequest = query.includes("cheap") || query.includes("budget") || query.includes("low cost") || query.includes("affordable");
                  const contentText = isCheapRequest 
                    ? `I have filtered and updated the recommendations to focus on budget-friendly and cheap hotels in ${parsedDest} along with flight details departing from ${dep}.`
                    : `Here is the comprehensive offline travel plan I generated for your journey to ${parsedDest}. I checked flight options, hotels, and structured a detailed timeline for your convenience.`;

                  const finalAIMessage: Message = {
                    id: aiMsgId,
                    sender: 'ai',
                    content: contentText,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    flights: getMockFlights(parsedDest, dep, flightDate),
                    hotels: getMockHotels(parsedDest, query),
                    itinerary: getMockItinerary(parsedDest, daysCount),
                    summary: getMockSummary(parsedDest, daysCount, dep),
                    showFlightsOnly,
                    showHotelsOnly,
                    showItineraryOnly
                  };

                  setTripsConversations(prev => ({
                    ...prev,
                    [threadId]: [...baseConvo, finalAIMessage]
                  }));

                  // Update sidebar item name
                  setPreviousTrips(prev => prev.map(t => 
                    t.id === threadId 
                      ? { ...t, destination: parsedDest, summary: `${daysCount}-day custom itinerary` } 
                      : t
                  ));

                }, 1000);
              }, 1200);
            }, 1000);
          }, 1200);
        }, 1000);
      }, 1200);
    }, 1000);
  };

  const updateAgent = (id: string, status: 'idle' | 'running' | 'completed' | 'failed', progress: number, details?: string) => {
    setAgents(prev => {
      return prev.map(agent => {
        if (agent.id === id) {
          return { ...agent, status, progress, details };
        }
        return agent;
      });
    });
  };

  // Helper dynamic mock data based on destination name
  function getMockFlights(dest: string, dep: string = "Delhi", flightDate?: string): Flight[] {
    const depCode = dep.slice(0, 3).toUpperCase();
    const destCode = dest.slice(0, 3).toUpperCase();
    
    const codeMap: Record<string, string> = {
      "Gwalior": "GWL",
      "Delhi": "DEL",
      "Mumbai": "BOM",
      "Tokyo": "NRT",
      "Paris": "CDG",
      "Rome": "FCO",
      "Jaipur": "JAI",
      "Udaipur": "UDR",
      "Switzerland": "ZRH",
      "Swiss Alps": "ZRH",
      "Banglore": "BLR",
      "Bangalore": "BLR"
    };
    
    const dCode = codeMap[dep] || depCode;
    const aCode = codeMap[dest] || destCode;

    // Check if flight route is international
    const isInternational = dest.toLowerCase().includes("tokyo") || 
                            dest.toLowerCase().includes("paris") || 
                            dest.toLowerCase().includes("rome") || 
                            dest.toLowerCase().includes("swiss") ||
                            dest.toLowerCase().includes("switzerland") ||
                            dep.toLowerCase().includes("tokyo") || 
                            dep.toLowerCase().includes("paris") || 
                            dep.toLowerCase().includes("rome");
    
    const price1 = isInternational ? "₹54,200" : "₹6,400";
    const price2 = isInternational ? "₹49,800" : "₹5,800";
    const dur = isInternational ? "9h 45m" : "2h 45m";
    const stopover = isInternational ? "1 Stop" : "Direct";

    return [
      {
        id: `f-dyn-1`,
        airlineLogo: '',
        airlineName: 'Air India',
        departure: dCode,
        departureTime: '10:30 AM',
        arrival: aCode,
        arrivalTime: '01:15 PM',
        duration: dur,
        stops: stopover,
        price: price1,
        status: 'Scheduled',
        date: flightDate
      },
      {
        id: `f-dyn-2`,
        airlineLogo: '',
        airlineName: 'IndiGo',
        departure: dCode,
        departureTime: '04:50 PM',
        arrival: aCode,
        arrivalTime: '07:35 PM',
        duration: dur,
        stops: stopover,
        price: price2,
        status: 'Scheduled',
        date: flightDate
      }
    ];
  }

  function getMockHotels(dest: string, queryText?: string): Hotel[] {
    const loc = dest.split(',')[0].trim();
    const cleanDest = dest.toLowerCase();
    const isCheapRequest = queryText?.toLowerCase().includes("cheap") || 
                           queryText?.toLowerCase().includes("budget") || 
                           queryText?.toLowerCase().includes("low cost") ||
                           queryText?.toLowerCase().includes("affordable");

    let hotelsList: Hotel[] = [];
    
    if (cleanDest.includes('jaipur')) {
      hotelsList = [
        {
          id: 'h-jai-1',
          image: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&q=80&w=400',
          name: 'The Rambagh Palace',
          rating: 4.9,
          price: '₹45,000',
          amenities: ['Spa', 'Heritage Gardens', 'Outdoor Pool', 'Butler Service'],
          location: 'Bhawani Singh Road, Jaipur'
        },
        {
          id: 'h-jai-2',
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400',
          name: 'ITC Rajputana',
          rating: 4.7,
          price: '₹14,500',
          amenities: ['Free Wi-Fi', 'Swimming Pool', 'Multi-cuisine Restaurant'],
          location: 'Station Road, Jaipur'
        },
        {
          id: 'h-jai-3',
          image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=400',
          name: 'Zostel Jaipur (Cheap)',
          rating: 4.5,
          price: '₹1,200',
          amenities: ['Free Wi-Fi', 'Rooftop Cafe', 'Social Common Room'],
          location: 'Hawa Mahal Bazaar, Jaipur'
        }
      ];
    } else if (cleanDest.includes('tokyo')) {
      hotelsList = [
        {
          id: 'h-tyo-1',
          image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400',
          name: 'Park Hyatt Tokyo',
          rating: 4.9,
          price: '₹72,000',
          amenities: ['Pool', 'Fitness Center', 'Free Wi-Fi', 'Luxury Spa'],
          location: 'Shinjuku, Tokyo'
        },
        {
          id: 'h-tyo-2',
          image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=400',
          name: 'Shinjuku Washington Hotel',
          rating: 4.3,
          price: '₹12,500',
          amenities: ['Free Wi-Fi', 'Airport Shuttle', 'Japanese Restaurant'],
          location: 'Nishi-Shinjuku, Tokyo'
        },
        {
          id: 'h-tyo-3',
          image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=400',
          name: 'Capsule Hotel Anshin Oyado (Cheap)',
          rating: 4.4,
          price: '₹4,200',
          amenities: ['Onsen Bath', 'Capsule Sleep Pods', 'Free Soft Drinks'],
          location: 'Shinjuku Center, Tokyo'
        }
      ];
    } else if (cleanDest.includes('paris')) {
      hotelsList = [
        {
          id: 'h-par-1',
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400',
          name: 'Hotel Plaza Athénée',
          rating: 4.9,
          price: '₹55,000',
          amenities: ['Eiffel Tower View', 'Dior Spa', 'Garden Courtyard'],
          location: 'Avenue Montaigne, Paris'
        },
        {
          id: 'h-par-2',
          image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=400',
          name: 'Novotel Paris Centre Tour Eiffel',
          rating: 4.4,
          price: '₹18,500',
          amenities: ['Swimming Pool', 'Fitness Room', 'Seine River View'],
          location: 'Front de Seine, Paris'
        },
        {
          id: 'h-par-3',
          image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400',
          name: 'Generator Paris Hostel (Cheap)',
          rating: 4.2,
          price: '₹3,800',
          amenities: ['Rooftop Bar', 'Social Lounge', 'Laundry Service'],
          location: '10th Arrondissement, Paris'
        }
      ];
    } else if (cleanDest.includes('rome')) {
      hotelsList = [
        {
          id: 'h-rom-1',
          image: 'https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&q=80&w=400',
          name: 'Hotel de Russie',
          rating: 4.8,
          price: '₹41,000',
          amenities: ['Secret Garden', 'Full-service Spa', 'Historical Courtyard'],
          location: 'Piazza del Popolo, Rome'
        },
        {
          id: 'h-rom-2',
          image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400',
          name: 'IQ Hotel Roma',
          rating: 4.6,
          price: '₹14,200',
          amenities: ['Sauna', 'Rooftop Terrace', 'Self-service Laundry'],
          location: 'Repubblica Area, Rome'
        },
        {
          id: 'h-rom-3',
          image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400',
          name: 'The YellowSquare Rome (Cheap)',
          rating: 4.5,
          price: '₹3,500',
          amenities: ['Live Concert Hall', 'Shared Kitchen', 'Bicycle Rental'],
          location: 'Termini Station, Rome'
        }
      ];
    } else if (cleanDest.includes('swiss') || cleanDest.includes('switzerland')) {
      hotelsList = [
        {
          id: 'h-swi-1',
          image: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&q=80&w=400',
          name: 'The Chedi Andermatt',
          rating: 4.9,
          price: '₹48,000',
          amenities: ['Indoor Fireplace', 'Alpine Spa', 'Heated Pool', 'Ski Butler'],
          location: 'Andermatt, Switzerland'
        },
        {
          id: 'h-swi-2',
          image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400',
          name: 'Swiss Alpine Lodge (Cheap)',
          rating: 4.4,
          price: '₹5,600',
          amenities: ['Scenic Mountain Views', 'Hot Tub', 'Complimentary Cocoa'],
          location: 'Grindelwald, Switzerland'
        }
      ];
    } else {
      hotelsList = [
        {
          id: 'h-gen-1',
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400',
          name: `The ${loc} Grand Lodge`,
          rating: 4.5,
          price: '₹8,500',
          amenities: ['Free Wi-Fi', 'Breakfast Buffet', 'Pool Access'],
          location: `Central Area, ${loc}`
        },
        {
          id: 'h-gen-2',
          image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400',
          name: `Backpackers ${loc} Stay (Cheap)`,
          rating: 4.2,
          price: '₹1,800',
          amenities: ['Shared Bunks', 'Social Lounge', 'Kitchen Access'],
          location: `Old Town, ${loc}`
        }
      ];
    }

    if (isCheapRequest) {
      // Return hotels under 20k, showing cheapest first
      return hotelsList.filter(h => h.name.toLowerCase().includes("cheap") || parseInt(h.price.replace(/[^\d]/g, "")) < 20000).reverse();
    }
    
    return hotelsList;
  }

  function getMockItinerary(dest: string, daysCount: number = 3): ItineraryDay[] {
    const cleanDest = dest.toLowerCase();
    const loc = dest.split(',')[0].trim();
    
    const jaipurActivities = [
      { morning: { title: 'Amber Fort Royal Tour', description: 'Explore the historic Amber Fort, climb the stone ramparts, and marvel at the Sheesh Mahal (Mirror Palace).', location: 'Amer, Jaipur' }, afternoon: { title: 'Hawa Mahal & City Palace Stroll', description: 'Photograph the famous facade of the Palace of Winds, visit the Royal Museum and arms collections.', location: 'Pink City, Jaipur' }, evening: { title: 'Chokhi Dhani Rajasthani Village', description: 'Enjoy traditional folk dances, camel rides, local magic shows, and an authentic sit-down thali dinner.', location: 'Tonk Road, Jaipur' } },
      { morning: { title: 'Jantar Mantar Stone Sundial', description: 'Walk through the UNESCO world heritage astronomical observatory and see ancient stone measurement instruments.', location: 'Pink City, Jaipur' }, afternoon: { title: 'Albert Hall Museum & Gardens', description: 'Stroll through Indo-Saracenic design galleries housing ancient royal armor, pottery, and paintings.', location: 'Ram Niwas Garden' }, evening: { title: 'Sunset Views from Nahargarh Fort', description: 'Watch the entire Pink City turn golden at sunset from the cliffside ramparts.', location: 'Nahargarh Hills' } },
      { morning: { title: 'Galta Ji Monkey Temple Hike', description: 'Explore sacred stone pools and structures hosting hundreds of wild monkeys in natural gorges.', location: 'Galta Hills' }, afternoon: { title: 'Bapu Bazaar Handicrafts Shopping', description: 'Shop for local block-printed textiles, blue pottery, gemstone jewelry, and traditional leather mojris.', location: 'Bapu Bazaar, Jaipur' }, evening: { title: 'Culinary walk & Lassiwala tasting', description: 'Sip thick yogurt lassis served in clay pots and eat piping hot pyaz kachoris.', location: 'MI Road, Jaipur' } },
      { morning: { title: 'Jaigarh Fort Armor Exhibition', description: 'See the massive Jaivana Cannon (once the world\'s largest) and browse the medieval royal armory.', location: 'Jaigarh Hills' }, afternoon: { title: 'Jal Mahal lake photography', description: 'Capture photos of the breathtaking water palace floating in the middle of Man Sagar Lake.', location: 'Amer Road, Jaipur' }, evening: { title: 'Traditional Puppet Show & Dance', description: 'Watch local puppeteers tell ancient folklore tales accompanied by classical Rajasthani instruments.', location: 'Old City, Jaipur' } },
      { morning: { title: 'Birla Temple Marble Walk', description: 'Admire the stained glass windows and intricate white marble carvings at the modern Birla Mandir.', location: 'Tilak Nagar, Jaipur' }, afternoon: { title: 'Sisodia Rani Palace Gardens', description: 'Stroll through terraced multi-level royal gardens filled with fountains, watercourses, and painted pavilions.', location: 'Agra Road, Jaipur' }, evening: { title: 'Nahargarh Biological Safari', description: 'Take a guided jeep safari to spot Indian leopards, deer, and exotic migratory birds in their natural habitat.', location: 'Nahargarh Reserve' } },
      { morning: { title: 'Handicraft Block Printing Class', description: 'Participate in a hands-on block-printing workshop using natural dyes to make your own custom scarf.', location: 'Sanganer, Jaipur' }, afternoon: { title: 'Amrapali Jewelry Museum', description: 'Marvel at historical tribal silver ornaments, royal headpieces, and gemstone-crusted weapons.', location: 'Ashok Nagar, Jaipur' }, evening: { title: 'Rooftop Dinner at Peacock Cafe', description: 'Enjoy dynamic views of the illuminated city skyline while dining on organic local curries.', location: 'Hathroi Fort, Jaipur' } }
    ];

    const tokyoActivities = [
      { morning: { title: 'Senso-ji Temple Visit', description: 'Explore Tokyo\'s oldest Buddhist temple in Asakusa and shop for snacks on Nakamise Street.', location: 'Asakusa, Tokyo' }, afternoon: { title: 'Shibuya Crossing & Harajuku Stroll', description: 'Cross the famous intersection and walk down Takeshita Street in Harajuku for neon colors and crêpes.', location: 'Shibuya, Tokyo' }, evening: { title: 'Shinjuku Omoide Yokocho Dinner', description: 'Dine in traditional narrow alleys serving grilled yakitori skewers under retro lanterns.', location: 'Shinjuku, Tokyo' } },
      { morning: { title: 'Tsukiji Outer Market Tasting', description: 'Sample fresh seafood snacks, sushi rolls, tamagoyaki (sweet omelets), and green teas.', location: 'Tsukiji, Tokyo' }, afternoon: { title: 'Meiji Shrine & Yoyogi Park walking', description: 'Walk through massive wooden torii gates into a forest hosting Tokyo\'s main Shinto shrine.', location: 'Chiyoda, Tokyo' }, evening: { title: 'TeamLab Planets Digital Museum', description: 'Walk barefoot through water and immersive light projection rooms.', location: 'Toyosu, Tokyo' } },
      { morning: { title: 'Akihabara Electronics Exploration', description: 'Explore giant multi-level retro gaming stores, anime shops, and maid cafes in the neon-lit electric town.', location: 'Akihabara, Tokyo' }, afternoon: { title: 'Ueno Park Museum Walk', description: 'Stroll through giant lotus ponds and visit the Tokyo National Museum housing ancient samurai swords.', location: 'Ueno Park, Tokyo' }, evening: { title: 'Tokyo Skytree Sunset Panorama', description: 'Ascend 450 meters to the observatory deck for sunset views of the endless skyline and Mount Fuji.', location: 'Sumida, Tokyo' } },
      { morning: { title: 'Ghibli Animation Museum Tour', description: 'Walk through the whimsical fairytale building showcasing original sketches and short animated films.', location: 'Mitaka, Tokyo' }, afternoon: { title: 'Inokashira Park Rowing Boat', description: 'Rent a swan-shaped paddle boat to explore the central lake surrounded by hanging cherry blossom trees.', location: 'Kichijoji, Tokyo' }, evening: { title: 'Local Izakaya Alley dining', description: 'Experience local culture by drinking sake and eating savory okonomiyaki pancakes in narrow side streets.', location: 'Harmonica Yokocho, Tokyo' } },
      { morning: { title: 'Imperial Palace East Gardens', description: 'Walk through the historical stone ruins, moats, and bamboo gardens of the former Edo Castle.', location: 'Chiyoda, Tokyo' }, afternoon: { title: 'Ginza Luxury District Shopping', description: 'Visit giant modern flagship showrooms, stationery stores, and high-end department food halls.', location: 'Ginza, Tokyo' }, evening: { title: 'Sushi Making Masterclass', description: 'Learn the precise art of slicing fresh fish and shaping nigiri sushi under the guidance of a local chef.', location: 'Tsukiji, Tokyo' } },
      { morning: { title: 'Odaiba Artificial Island Walk', description: 'Cross Tokyo Bay to see the giant Unicorn Gundam statue, indoor theme parks, and the mini Statue of Liberty.', location: 'Odaiba, Tokyo' }, afternoon: { title: 'National Museum of Emerging Science', description: 'Interact with humanoid robots, astronaut space stations, and global climate projection globes.', location: 'Koto City, Tokyo' }, evening: { title: 'Rainbow Bridge Sunset stroll', description: 'Walk across the suspended pedestrian bridge for iconic skyline views as the city lights up.', location: 'Tokyo Bay' } }
    ];

    const parisActivities = [
      { morning: { title: 'Louvre Museum Treasures', description: 'Skip the line to see the Mona Lisa, Venus de Milo, and classical European masterpieces.', location: '1st Arr., Paris' }, afternoon: { title: 'Jardin des Tuileries & Cafe Lunch', description: 'Walk through geometric French gardens and enjoy a Parisian cafe lunch with escargots and baguettes.', location: 'Rue de Rivoli, Paris' }, evening: { title: 'Seine River Sunset Cruise', description: 'Watch the monuments along the river bank light up from an open-deck glass boat.', location: 'Port de la Bourdonnais' } },
      { morning: { title: 'Eiffel Tower Summit Access', description: 'Ascend to the highest accessible platform in Europe for panoramic views of Paris.', location: 'Champs de Mars' }, afternoon: { title: 'Montmartre Artistic Stroll', description: 'Climb the steps to Sacré-Cœur basilica and browse portraits at Place du Tertre.', location: '18th Arr., Paris' }, evening: { title: 'Latin Quarter Culinary Dinner', description: 'Enjoy traditional French Onion soup and duck confit in a historic alley bistro.', location: '5th Arr., Paris' } },
      { morning: { title: 'Palace of Versailles Tour', description: 'Take a short train ride to explore the Hall of Mirrors and opulent royal private apartments.', location: 'Versailles, France' }, afternoon: { title: 'Grand Trianon & Marie Antoinette Estate', description: 'Stroll through pink marble columns and the rustic model village built for the queen.', location: 'Versailles Gardens' }, evening: { title: 'Versailles Fountain Show', description: 'Watch classical music water fountains light up with color in the palace gardens.', location: 'Versailles' } },
      { morning: { title: 'Musée d\'Orsay Masterpieces', description: 'Stroll through a converted railway station housing the world\'s largest collection of Impressionist art.', location: '7th Arr., Paris' }, afternoon: { title: 'Champs-Élysées walking', description: 'Walk down the famous tree-lined avenue, visiting local fashion boutiques and French macaron shops.', location: '8th Arr., Paris' }, evening: { title: 'Arc de Triomphe Sunset', description: 'Climb the historic arch for spectacular sunset views of the twelve radiating Parisian avenues.', location: 'Place Charles de Gaulle' } },
      { morning: { title: 'Notre-Dame Cathedral Walk', description: 'Stroll through the historic Île de la Cité, admiring Gothic gargoyles and architectural restorations.', location: '4th Arr., Paris' }, afternoon: { title: 'Sainte-Chapelle Stained Glass', description: 'Step inside a jewel-box gothic chapel featuring 1,113 stained glass panels depicting biblical history.', location: '1st Arr., Paris' }, evening: { title: 'Jazz Club in Saint-Germain', description: 'Experience live Parisian swing jazz inside a historic underground stone cellar.', location: 'Saint-Germain-des-Prés' } },
      { morning: { title: 'Centre Pompidou Modern Art', description: 'Browse contemporary paintings and sculptures inside an iconic industrial-style pipe building.', location: '4th Arr., Paris' }, afternoon: { title: 'Marais District Historic Stroll', description: 'Walk past medieval mansions, hidden courtyards, and trendy local falafel shops.', location: '4th Arr., Paris' }, evening: { title: 'French Pastry Baking Class', description: 'Learn the secrets of baking light, airy chocolate croissants and macarons under a pastry chef.', location: '3rd Arr., Paris' } }
    ];

    const genericActivities = [
      { morning: { title: `Explore ${loc} Downtown`, description: `Begin your trip by visiting main local plazas, historic architectures, and orientation parks.`, location: `${loc} Square` }, afternoon: { title: `Local Gastronomy Walk`, description: `Savor authentic regional dishes on a guided food testing trail through local markets.`, location: `City Market` }, evening: { title: `Scenic Overlook Dinner`, description: `Wind down with a sunset dining experience at the highest view point in the area.`, location: `Sunset Outlook` } },
      { morning: { title: `${loc} Lake or River Cruise`, description: `Take a peaceful early morning boat ride to explore the surrounding nature and capture photos.`, location: `Waterfront Dock` }, afternoon: { title: `Traditional Craft Workshop`, description: `Observe and learn traditional local crafts such as pottery, silk weaving, or block printing.`, location: `Artisans Village` }, evening: { title: `Folk Music & Culture Show`, description: `Attend a traditional live performance showcasing regional history, music, and dance.`, location: `Amphitheatre` } },
      { morning: { title: 'Botanical Gardens Walk', description: 'Discover native flower breeds, giant greenhouses, and quiet Zen ponds inside the city reserve.', location: 'Nature Park' }, afternoon: { title: 'Local History Museum', description: 'Browse archaeological findings, historical documents, and folk art tracing the city\'s origins.', location: 'Central Museum' }, evening: { title: 'Stargazing at Mountain Peak', description: 'Drive up to a high-altitude observatory platform to observe constellations through high-power telescopes.', location: 'Summit Hill' } },
      { morning: { title: 'Historical Castle Ruins', description: 'Climb old stone ramparts and watchtowers overlooking the entire valley region.', location: 'Old Castle' }, afternoon: { title: 'Local Vineyard or Farm Tour', description: 'Learn about local farming techniques, fruit harvesting, and enjoy a fresh organic lunch.', location: 'Valley Vineyard' }, evening: { title: 'Bicycle Stroll on Waterfront', description: 'Rent a beach cruiser to ride along the scenic coastal pathway as sunset begins.', location: 'Waterfront Path' } },
      { morning: { title: 'Adventure Valley Hiking', description: 'Trek along scenic gorge trails, pass forest waterfalls, and reach a peak view platform.', location: 'Valley Trails' }, afternoon: { title: 'Local Artisan Bazaar', description: 'Browse and purchase handmade souvenirs, wooden toys, leather goods, and spices.', location: 'Crafts Market' }, evening: { title: 'Campfire and Local Stories', description: 'Gather around a forest campfire to listen to traditional folk songs and historical storytelling.', location: 'Campground' } },
      { morning: { title: 'Ancient Cave Exploration', description: 'Trek deep inside illuminated limestone caverns housing ancient stalactites and cave murals.', location: 'Eco Caves' }, afternoon: { title: 'Traditional Tea Ceremony', description: 'Participate in a quiet local tea tasting workshop showcasing seasonal loose-leaf brews.', location: 'Heritage Tea Room' }, evening: { title: 'Farewell Gala & Fusion Dining', description: 'Celebrate your final travel night with a high-end gourmet dining experience combining local and global cuisine.', location: 'Skyline Restaurant' } }
    ];

    let activityBank = genericActivities;
    if (cleanDest.includes('jaipur')) activityBank = jaipurActivities;
    else if (cleanDest.includes('tokyo')) activityBank = tokyoActivities;
    else if (cleanDest.includes('paris')) activityBank = parisActivities;

    const itinerary: ItineraryDay[] = [];
    for (let i = 1; i <= daysCount; i++) {
      const act = activityBank[(i - 1) % activityBank.length];
      itinerary.push({
        day: i,
        date: `Day ${i}`,
        morning: act.morning,
        afternoon: act.afternoon,
        evening: act.evening
      });
    }
    return itinerary;
  }

  function getMockSummary(dest: string, daysCount: number = 3, dep: string = "Delhi"): TravelSummary {
    const loc = dest.split(',')[0].trim();
    const cleanDest = dest.toLowerCase();
    
    const budgetMin = 6000 * daysCount;
    const budgetMax = 12000 * daysCount;
    const budgetStr = `₹${budgetMin.toLocaleString()} - ₹${budgetMax.toLocaleString()}`;
    
    if (cleanDest.includes('jaipur')) {
      return {
        destination: 'Jaipur, Rajasthan',
        budget: budgetStr,
        bestFlights: `Direct flights from ${dep} via Air India / IndiGo`,
        recommendedHotel: 'The Rambagh Palace',
        placesToVisit: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Nahargarh Fort', 'Jantar Mantar'],
        thingsToCarry: ['Light cotton clothing', 'Sunglasses', 'Comfortable sneakers', 'Sunscreen'],
        weatherTips: 'Warm and sunny. Winter months (Nov-Feb) are very pleasant; summers can be hot.',
        travelTips: 'Bargain at local bazaars. Government authorized guides are recommended at monuments.'
      };
    } else if (cleanDest.includes('tokyo')) {
      return {
        destination: 'Tokyo, Japan',
        budget: budgetStr,
        bestFlights: `Direct flights from ${dep} via JAL`,
        recommendedHotel: 'Park Hyatt Tokyo',
        placesToVisit: ['Senso-ji Temple', 'Shibuya Crossing', 'TeamLab Planets', 'Meiji Shrine'],
        thingsToCarry: ['Transit Card app', 'Universal Adapter', 'Cash (Yen)'],
        weatherTips: 'Moderate weather. Autumn or Spring are best.',
        travelTips: 'Tipping is not required. Keep left on escalators.'
      };
    } else if (cleanDest.includes('paris')) {
      return {
        destination: 'Paris, France',
        budget: budgetStr,
        bestFlights: `Direct flights from ${dep} via Air France`,
        recommendedHotel: 'Hotel Plaza Athénée',
        placesToVisit: ['Eiffel Tower', 'Louvre Museum', 'Montmartre', 'Palace of Versailles'],
        thingsToCarry: ['Comfortable sneakers', 'Anti-theft sling bag', 'Adaptor type C/E'],
        weatherTips: 'Pleasant summer with occasional showers. Winter requires thick wool coats.',
        travelTips: 'Greet shopkeepers with "Bonjour" before browsing. Beware of pickpockets.'
      };
    }

    return {
      destination: dest,
      budget: budgetStr,
      bestFlights: `Direct Flights from ${dep} available via domestic liners`,
      recommendedHotel: `Grand ${loc} Lodge`,
      placesToVisit: [`${loc} Old Town`, 'City Gardens', 'Central Historic Museum'],
      thingsToCarry: ['Valid Travel Documents', 'Comfortable Walking Shoes', 'Universal Adapter'],
      weatherTips: 'Weather is typically moderate. Check local forecasts 3 days prior to flights.',
      travelTips: 'Book popular sightseeing tickets online in advance to avoid long queue lines.'
    };
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f9fc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Sidebar Panel */}
      <Sidebar
        previousTrips={previousTrips}
        activeTripId={activeTripId}
        onSelectTrip={handleSelectTrip}
        onNewTrip={handleNewTrip}
        onDeleteTrip={handleDeleteTrip}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Dimmed backdrop overlay for mobile viewports when sidebar is toggled open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-45 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Central Screen (Navbar + ChatArea) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar 
          currentTripName={currentTripName} 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
        />
        <ChatArea
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleSendMessage}
          onSelectTemplate={handleSelectTemplate}
        />
      </div>

      {/* Right Sidebar Agent Monitor */}
      <AgentPanel agents={agents} />
    </div>
  );
}

export default App;
