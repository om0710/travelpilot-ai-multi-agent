import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Plus, History, Settings, Map, ChevronRight, Trash2 } from 'lucide-react';
import type { TripHistory } from '../types';

interface SidebarProps {
  previousTrips: TripHistory[];
  activeTripId: string | null;
  onSelectTrip: (id: string) => void;
  onNewTrip: () => void;
  onDeleteTrip: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  previousTrips,
  activeTripId,
  onSelectTrip,
  onNewTrip,
  onDeleteTrip,
}) => {
  return (
    <aside className="w-80 h-screen border-r border-slate-200/50 dark:border-slate-800/30 flex flex-col justify-between p-6 glass-premium z-10 select-none">
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 mb-8 cursor-pointer" onClick={onNewTrip}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-outfit">
              TravelPilot <span className="text-gradient">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase font-semibold">
              Multi-Agent Planner
            </p>
          </div>
        </div>

        {/* New Trip Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewTrip}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 text-white font-medium flex items-center justify-center space-x-2 shadow-md shadow-brand-600/15 hover:shadow-brand-600/25 transition-shadow mb-8 outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>New Planner Session</span>
        </motion.button>

        {/* History Header */}
        <div className="flex items-center space-x-2 px-1 mb-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <History className="w-3.5 h-3.5" />
          <span>Previous Trips</span>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          {previousTrips.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-600">
              No recent trips. Start planning above!
            </div>
          ) : (
            previousTrips.map((trip) => {
              const isActive = trip.id === activeTripId;
              return (
                <motion.div
                   key={trip.id}
                   whileHover={{ x: 2 }}
                   onClick={() => onSelectTrip(trip.id)}
                   className={`group p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 ${
                     isActive
                       ? 'bg-brand-50/80 dark:bg-brand-950/20 border border-brand-100/50 dark:border-brand-900/30'
                       : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/20 border border-transparent'
                   }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden flex-1">
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                      <Map className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className={`text-sm font-medium truncate ${isActive ? 'text-brand-900 dark:text-brand-300' : 'text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                        {trip.destination}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {trip.date} • {trip.summary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-brand-500' : ''}`} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrip(trip.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer outline-none"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Settings */}
      <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/30 space-y-4">
        {/* Settings button */}
        <button className="w-full py-3 px-4 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/20 border border-transparent hover:border-slate-200/20 text-slate-500 dark:text-slate-400 flex items-center justify-between transition-all">
          <div className="flex items-center space-x-3">
            <Settings className="w-4.5 h-4.5" />
            <span className="text-sm font-medium">Settings & API Keys</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></div>
        </button>
      </div>
    </aside>
  );
};
