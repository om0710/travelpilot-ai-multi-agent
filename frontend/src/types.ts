export interface Flight {
  id: string;
  airlineLogo: string;
  airlineName: string;
  departure: string;
  departureTime: string;
  arrival: string;
  arrivalTime: string;
  duration: string;
  stops: string;
  price: string;
  status: string;
  date?: string;
}

export interface Hotel {
  id: string;
  image: string;
  name: string;
  rating: number;
  price: string;
  amenities: string[];
  location: string;
}

export interface ItineraryTimeSlot {
  title: string;
  description: string;
  location?: string;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  morning: ItineraryTimeSlot;
  afternoon: ItineraryTimeSlot;
  evening: ItineraryTimeSlot;
}

export interface TravelSummary {
  destination: string;
  budget: string;
  bestFlights: string;
  recommendedHotel: string;
  placesToVisit: string[];
  thingsToCarry: string[];
  weatherTips: string;
  travelTips: string;
}

export type AgentId = 'flight' | 'hotel' | 'itinerary' | 'final';

export interface AgentStatus {
  id: AgentId;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  description: string;
  progress: number;
  details?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  flights?: Flight[];
  hotels?: Hotel[];
  itinerary?: ItineraryDay[];
  summary?: TravelSummary;
  showFlightsOnly?: boolean;
  showHotelsOnly?: boolean;
  showItineraryOnly?: boolean;
}

export interface TripHistory {
  id: string;
  destination: string;
  date: string;
  summary: string;
}
