import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import type { Flight } from '../types';

interface FlightCardProps {
  flight: Flight;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-5 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/40 dark:border-slate-800/30 shadow-sm hover:shadow-md hover:border-brand-500/20 dark:hover:border-brand-500/20 transition-all duration-300 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0"
    >
      {/* Airline logo and Name */}
      <div className="flex items-center space-x-3.5 md:w-1/4">
        <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-800/40 font-bold text-slate-400 dark:text-slate-500 text-lg uppercase select-none">
          {flight.airlineLogo ? (
            <img src={flight.airlineLogo} alt={flight.airlineName} className="w-6 h-6 object-contain" />
          ) : (
            flight.airlineName.charAt(0)
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {flight.airlineName}
          </h4>
          <span className="text-[10px] py-0.5 px-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase">
            {flight.status}
          </span>
        </div>
      </div>

      {/* Flight Path (Departure -> Arrival) */}
      <div className="flex items-center space-x-6 flex-1 justify-center md:justify-start px-2">
        <div className="text-right">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">{flight.departureTime}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase mt-0.5">{flight.departure}</p>
        </div>

        {/* Path Visualiser */}
        <div className="flex-1 max-w-[120px] flex flex-col items-center justify-center relative px-2 select-none">
          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mb-1">{flight.duration}</span>
          <div className="w-full flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex-1 h-[1.5px] border-t border-dashed border-slate-300 dark:border-slate-700 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0b0f19] px-1">
                <Clock className="w-3 h-3 text-brand-500" />
              </div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
          </div>
          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1">{flight.stops}</span>
        </div>

        <div className="text-left">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">{flight.arrivalTime}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase mt-0.5">{flight.arrival}</p>
        </div>
      </div>

      {/* Price & Book Button */}
      <div className="flex items-center justify-between md:justify-end space-x-6 md:w-1/4">
        <div className="text-left md:text-right">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Average Price</p>
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-0.5">{flight.price}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all"
        >
          Select Flight
        </motion.button>
      </div>
    </motion.div>
  );
};
