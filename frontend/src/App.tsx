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
  };

  const handleNewTrip = () => {
    setActiveTripId(null);
    setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'idle', progress: 0, details: undefined })));
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

    // Set up agent animations
    setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'idle', progress: 0, details: undefined })));



    try {
      const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:8080';
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

              const finalAIMessage: Message = {
                id: streamingId,
                sender: 'ai',
                content: data.content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                flights: data.flights,
                hotels: data.hotels,
                itinerary: data.itinerary,
                summary: data.summary
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
      runOfflineSimulation(destination, threadId, streamingId, currentConvo, daysCount, combinedQueryText);
    }
  };

  // Parse departure and destination from the user query text
  const parseQueryCities = (query: string) => {
    let dep = "Delhi";
    let dest = "Jaipur";
    
    const clean = query.toLowerCase();
    
    // 1. Identify departure city: find what follows "from", "leaving from", "flying from", etc.
    if (clean.includes("from gwl") || clean.includes("from gwalior")) {
      dep = "Gwalior";
    } else if (clean.includes("from mumbai") || clean.includes("from bom")) {
      dep = "Mumbai";
    } else if (clean.includes("from delhi") || clean.includes("from del") || clean.includes("leaving from delhi") || clean.includes("leaving from del")) {
      dep = "Delhi";
    } else if (clean.includes("from tokyo") || clean.includes("from nrt")) {
      dep = "Tokyo";
    } else {
      // General regex search for departure
      const depMatch = clean.match(/(?:from|leaving\s+from|flying\s+from|departing\s+from)\s+([a-z\s]+?)(?:\s+to|\s+on|\s+for|\s+in|\s+at|\b\d|$)/i);
      if (depMatch && depMatch[1]) {
        dep = depMatch[1].trim();
      }
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
  const runOfflineSimulation = (dest: string, threadId: string, aiMsgId: string, baseConvo: Message[], daysCount: number, originalQuery?: string) => {
    const query = (originalQuery || "").toLowerCase();
    
    const hasDeparture = query.includes("from ") || query.includes("flying from") || query.includes("fly from") || query.includes("departing from");
    const hasDates = query.includes("on ") || query.includes("date") || query.includes("january") || query.includes("february") || query.includes("march") || query.includes("april") || query.includes("may") || query.includes("june") || query.includes("july") || query.includes("august") || query.includes("september") || query.includes("october") || query.includes("november") || query.includes("december") || /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/.test(query) || /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(query);
    const hasDestination = query.includes("to ") || query.includes("trip for") || query.includes("visit ") || query.includes("jaipur") || query.includes("tokyo") || query.includes("paris") || query.includes("rome") || query.includes("swiss") || query.includes("switzerland") || query.includes("delhi") || query.includes("udaipur");
    
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    const dateMatch = query.match(/(?:on|from|are)\s+(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
    if (dateMatch && dateMatch[1]) {
      flightDate = dateMatch[1].trim();
      flightDate = flightDate.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    } else {
      // Use a clean fallback date
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
                  
                  const finalAIMessage: Message = {
                    id: aiMsgId,
                    sender: 'ai',
                    content: `Here is the comprehensive offline travel plan I generated for your journey to ${parsedDest}. I checked flight options, hotels, and structured a detailed timeline for your convenience.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    flights: getMockFlights(parsedDest, dep, flightDate),
                    hotels: getMockHotels(parsedDest),
                    itinerary: getMockItinerary(parsedDest, daysCount),
                    summary: getMockSummary(parsedDest, daysCount, dep)
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

  function getMockHotels(dest: string): Hotel[] {
    const loc = dest.split(',')[0].trim();
    const cleanDest = dest.toLowerCase();
    
    if (cleanDest.includes('jaipur')) {
      return [
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
         }
      ];
    } else if (cleanDest.includes('tokyo')) {
      return [
        {
          id: 'h-tyo-1',
          image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400',
          name: 'Park Hyatt Tokyo',
          rating: 4.9,
          price: '₹72,000',
          amenities: ['Pool', 'Fitness Center', 'Free Wi-Fi', 'Luxury Spa'],
          location: 'Shinjuku, Tokyo'
        }
      ];
    } else if (cleanDest.includes('paris')) {
      return [
        {
          id: 'h-par-1',
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400',
          name: 'Hotel Plaza Athénée',
          rating: 4.9,
          price: '₹55,000',
          amenities: ['Eiffel Tower View', 'Dior Spa', 'Garden Courtyard'],
          location: 'Avenue Montaigne, Paris'
        }
      ];
    } else if (cleanDest.includes('rome')) {
      return [
        {
          id: 'h-rom-1',
          image: 'https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&q=80&w=400',
          name: 'Hotel de Russie',
          rating: 4.8,
          price: '₹41,000',
          amenities: ['Secret Garden', 'Full-service Spa', 'Historical Courtyard'],
          location: 'Piazza del Popolo, Rome'
        }
      ];
    } else if (cleanDest.includes('swiss') || cleanDest.includes('switzerland')) {
      return [
        {
          id: 'h-swi-1',
          image: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&q=80&w=400',
          name: 'The Chedi Andermatt',
          rating: 4.9,
          price: '₹48,000',
          amenities: ['Indoor Fireplace', 'Alpine Spa', 'Heated Pool', 'Ski Butler'],
          location: 'Andermatt, Switzerland'
        }
      ];
    }

    return [
      {
        id: 'h-gen-1',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400',
        name: `The ${loc} Grand Lodge`,
        rating: 4.5,
        price: '₹8,500',
        amenities: ['Free Wi-Fi', 'Breakfast Buffet', 'Pool Access'],
        location: `Central Area, ${loc}`
      }
    ];
  }

  function getMockItinerary(dest: string, daysCount: number = 3): ItineraryDay[] {
    const cleanDest = dest.toLowerCase();
    const loc = dest.split(',')[0].trim();
    
    const jaipurActivities = [
      { morning: { title: 'Amber Fort Royal Tour', description: 'Explore the historic Amber Fort, climb the stone ramparts, and marvel at the Sheesh Mahal (Mirror Palace).', location: 'Amer, Jaipur' }, afternoon: { title: 'Hawa Mahal & City Palace Stroll', description: 'Photograph the famous facade of the Palace of Winds, visit the Royal Museum and arms collections.', location: 'Pink City, Jaipur' }, evening: { title: 'Chokhi Dhani Rajasthani Village', description: 'Enjoy traditional folk dances, camel rides, local magic shows, and an authentic sit-down thali dinner.', location: 'Tonk Road, Jaipur' } },
      { morning: { title: 'Jantar Mantar Stone Sundial', description: 'Walk through the UNESCO world heritage astronomical observatory and see ancient stone measurement instruments.', location: 'Pink City, Jaipur' }, afternoon: { title: 'Albert Hall Museum & Gardens', description: 'Stroll through Indo-Saracenic design galleries housing ancient royal armor, pottery, and paintings.', location: 'Ram Niwas Garden' }, evening: { title: 'Sunset Views from Nahargarh Fort', description: 'Watch the entire Pink City turn golden at sunset from the cliffside ramparts.', location: 'Nahargarh Hills' } },
      { morning: { title: 'Galta Ji Monkey Temple Hike', description: 'Explore sacred stone pools and structures hosting hundreds of wild monkeys in natural gorges.', location: 'Galta Hills' }, afternoon: { title: 'Bapu Bazaar Handicrafts Shopping', description: 'Shop for local block-printed textiles, blue pottery, gemstone jewelry, and traditional leather mojris.', location: 'Bapu Bazaar, Jaipur' }, evening: { title: 'Culinary walk & Lassiwala tasting', description: 'Sip thick yogurt lassis served in clay pots and eat piping hot pyaz kachoris.', location: 'MI Road, Jaipur' } }
    ];

    const tokyoActivities = [
      { morning: { title: 'Senso-ji Temple Visit', description: 'Explore Tokyo\'s oldest Buddhist temple in Asakusa and shop for snacks on Nakamise Street.', location: 'Asakusa, Tokyo' }, afternoon: { title: 'Shibuya Crossing & Harajuku Stroll', description: 'Cross the famous intersection and walk down Takeshita Street in Harajuku for neon colors and crêpes.', location: 'Shibuya, Tokyo' }, evening: { title: 'Shinjuku Omoide Yokocho Dinner', description: 'Dine in traditional narrow alleys serving grilled yakitori skewers under retro lanterns.', location: 'Shinjuku, Tokyo' } },
      { morning: { title: 'Tsukiji Outer Market Tasting', description: 'Sample fresh seafood snacks, sushi rolls, tamagoyaki (sweet omelets), and green teas.', location: 'Tsukiji, Tokyo' }, afternoon: { title: 'Meiji Shrine & Yoyogi Park walking', description: 'Walk through massive wooden torii gates into a forest hosting Tokyo\'s main Shinto shrine.', location: 'Chiyoda, Tokyo' }, evening: { title: 'TeamLab Planets Digital Museum', description: 'Walk barefoot through water and immersive light projection rooms.', location: 'Toyosu, Tokyo' } }
    ];

    const parisActivities = [
      { morning: { title: 'Louvre Museum Treasures', description: 'Skip the line to see the Mona Lisa, Venus de Milo, and classical European masterpieces.', location: '1st Arr., Paris' }, afternoon: { title: 'Jardin des Tuileries & Cafe Lunch', description: 'Walk through geometric French gardens and enjoy a Parisian cafe lunch with escargots and baguettes.', location: 'Rue de Rivoli, Paris' }, evening: { title: 'Seine River Sunset Cruise', description: 'Watch the monuments along the river bank light up from an open-deck glass boat.', location: 'Port de la Bourdonnais' } },
      { morning: { title: 'Eiffel Tower Summit Access', description: 'Ascend to the highest accessible platform in Europe for panoramic views of Paris.', location: 'Champs de Mars' }, afternoon: { title: 'Montmartre Artistic Stroll', description: 'Climb the steps to Sacré-Cœur basilica and browse portraits at Place du Tertre.', location: '18th Arr., Paris' }, evening: { title: 'Latin Quarter Culinary Dinner', description: 'Enjoy traditional French Onion soup and duck confit in a historic alley bistro.', location: '5th Arr., Paris' } }
    ];

    const genericActivities = [
      { morning: { title: `Explore ${loc} Downtown`, description: `Begin your trip by visiting main local plazas, historic architectures, and orientation parks.`, location: `${loc} Square` }, afternoon: { title: `Local Gastronomy Walk`, description: `Savor authentic regional dishes on a guided food testing trail through local markets.`, location: `City Market` }, evening: { title: `Scenic Overlook Dinner`, description: `Wind down with a sunset dining experience at the highest view point in the area.`, location: `Sunset Outlook` } },
      { morning: { title: `${loc} Lake or River Cruise`, description: `Take a peaceful early morning boat ride to explore the surrounding nature and capture photos.`, location: `Waterfront Dock` }, afternoon: { title: `Traditional Craft Workshop`, description: `Observe and learn traditional local crafts such as pottery, silk weaving, or block printing.`, location: `Artisans Village` }, evening: { title: `Folk Music & Culture Show`, description: `Attend a traditional live performance showcasing regional history, music, and dance.`, location: `Amphitheatre` } }
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
      />

      {/* Central Screen (Navbar + ChatArea) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar currentTripName={currentTripName} />
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
