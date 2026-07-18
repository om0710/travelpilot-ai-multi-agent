import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sunrise, Sun, Sunset, MapPin, CalendarDays } from 'lucide-react';
import type { ItineraryDay } from '../types';

interface ItineraryTimelineProps {
  days: ItineraryDay[];
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ days }) => {
  const [activeDay, setActiveDay] = useState<number>(1);

  const getSlotIcon = (type: 'morning' | 'afternoon' | 'evening') => {
    switch (type) {
      case 'morning':
        return (
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/10">
            <Sunrise className="w-4 h-4" />
          </div>
        );
      case 'afternoon':
        return (
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/10">
            <Sun className="w-4 h-4" />
          </div>
        );
      case 'evening':
        return (
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/10">
            <Sunset className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 select-none">
      {/* Day Selector Buttons */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2 scroll-smooth">
        {days.map((day) => (
          <motion.button
            key={day.day}
            onClick={() => setActiveDay(day.day)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center space-x-2 whitespace-nowrap outline-none ${
              day.day === activeDay
                ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/30 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Day {day.day}</span>
          </motion.button>
        ))}
      </div>

      {/* Selected Day Timeline List */}
      <div className="relative border-l border-slate-200 dark:border-slate-800/60 pl-8 ml-4 space-y-8 py-2">
        <AnimatePresence mode="wait">
          {days
            .filter((d) => d.day === activeDay)
            .map((day) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Morning Slot */}
                <div className="relative">
                  {/* Timeline indicator circle */}
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  </div>
                  <div className="flex items-start space-x-4">
                    {getSlotIcon('morning')}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Morning</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">• 09:00 AM</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {day.morning.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {day.morning.description}
                      </p>
                      {day.morning.location && (
                        <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-2.5">
                          <MapPin className="w-3 h-3" />
                          <span>{day.morning.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Afternoon Slot */}
                <div className="relative">
                  {/* Timeline indicator circle */}
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-950 border-2 border-orange-400 flex items-center justify-center shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                  </div>
                  <div className="flex items-start space-x-4">
                    {getSlotIcon('afternoon')}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider">Afternoon</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">• 01:00 PM</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {day.afternoon.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {day.afternoon.description}
                      </p>
                      {day.afternoon.location && (
                        <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-2.5">
                          <MapPin className="w-3 h-3" />
                          <span>{day.afternoon.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Evening Slot */}
                <div className="relative">
                  {/* Timeline indicator circle */}
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-950 border-2 border-indigo-400 flex items-center justify-center shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  </div>
                  <div className="flex items-start space-x-4">
                    {getSlotIcon('evening')}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Evening</span>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">• 06:00 PM</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {day.evening.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {day.evening.description}
                      </p>
                      {day.evening.location && (
                        <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-2.5">
                          <MapPin className="w-3 h-3" />
                          <span>{day.evening.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
