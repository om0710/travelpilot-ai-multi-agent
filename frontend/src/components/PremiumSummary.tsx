import React from 'react';
import { Compass, DollarSign, Plane, Bed, Sparkles, ThermometerSun, Briefcase, Info } from 'lucide-react';
import type { TravelSummary } from '../types';

interface PremiumSummaryProps {
  summary: TravelSummary;
}

export const PremiumSummary: React.FC<PremiumSummaryProps> = ({ summary }) => {
  return (
    <div className="w-full bg-gradient-to-tr from-brand-500/5 to-sky-500/5 dark:from-brand-950/10 dark:to-sky-950/10 border border-brand-500/20 dark:border-brand-500/10 rounded-3xl p-6 md:p-8 space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/30 pb-6">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-outfit">
              AI Travel Summary: {summary.destination}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Compiled by TravelPilot Orchestration
            </p>
          </div>
        </div>
        {/* Budget Badge */}
        <div className="flex items-center space-x-2 bg-brand-500/10 dark:bg-brand-500/20 py-2 px-4 rounded-xl border border-brand-500/20 text-brand-600 dark:text-brand-400">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm font-bold tracking-tight">Est. Budget: {summary.budget}</span>
        </div>
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best flight pick */}
        <div className="p-4 bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/40 dark:border-slate-800/20 flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-brand-50/80 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400">
            <Plane className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Best Flight Recommendation</h4>
            <p className="text-sm font-bold text-slate-850 dark:text-slate-100 mt-1">{summary.bestFlights}</p>
          </div>
        </div>

        {/* Hotel Pick */}
        <div className="p-4 bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/40 dark:border-slate-800/20 flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400">
            <Bed className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Top Recommended Stay</h4>
            <p className="text-sm font-bold text-slate-850 dark:text-slate-100 mt-1">{summary.recommendedHotel}</p>
          </div>
        </div>
      </div>

      {/* Places to Visit & Things to Carry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Places to Visit */}
        <div className="space-y-3.5">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-350">
            <Compass className="w-4.5 h-4.5 text-brand-500" />
            <h4 className="text-sm font-bold">Must-Visit Places</h4>
          </div>
          <ul className="space-y-2">
            {summary.placesToVisit.map((place, idx) => (
              <li key={idx} className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                <span>{place}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Things to Carry */}
        <div className="space-y-3.5">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-350">
            <Briefcase className="w-4.5 h-4.5 text-brand-500" />
            <h4 className="text-sm font-bold">Recommended Packing Checklist</h4>
          </div>
          <ul className="space-y-2">
            {summary.thingsToCarry.map((thing, idx) => (
              <li key={idx} className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span>{thing}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Weather & Travel Tips Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200/50 dark:border-slate-800/30 pt-6">
        {/* Weather */}
        <div className="flex space-x-3.5">
          <div className="p-2 h-fit rounded-lg bg-amber-500/10 text-amber-500">
            <ThermometerSun className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-750 dark:text-slate-300">Weather & Seasonal Tips</h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{summary.weatherTips}</p>
          </div>
        </div>

        {/* Travel Tips */}
        <div className="flex space-x-3.5">
          <div className="p-2 h-fit rounded-lg bg-indigo-500/10 text-indigo-500">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-750 dark:text-slate-300">Expert Travel Guidelines</h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{summary.travelTips}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
