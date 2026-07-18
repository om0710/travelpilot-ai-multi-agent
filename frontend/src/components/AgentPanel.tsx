import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Bed, Calendar, FileText, Loader2, CheckCircle2, Circle } from 'lucide-react';
import type { AgentStatus } from '../types';

interface AgentPanelProps {
  agents: AgentStatus[];
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ agents }) => {
  const getIcon = (id: string, colorClass: string) => {
    switch (id) {
      case 'flight':
        return <Plane className={`w-4 h-4 ${colorClass}`} />;
      case 'hotel':
        return <Bed className={`w-4 h-4 ${colorClass}`} />;
      case 'itinerary':
        return <Calendar className={`w-4 h-4 ${colorClass}`} />;
      case 'final':
        return <FileText className={`w-4 h-4 ${colorClass}`} />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-brand-500 animate-spin flex-shrink-0" />;
      case 'failed':
        return <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />;
      default:
        return <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 flex-shrink-0" />;
    }
  };

  const getCardBg = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/10 dark:border-emerald-500/10';
      case 'running':
        return 'bg-brand-500/5 border-brand-500/30 dark:bg-brand-950/10 dark:border-brand-500/20';
      default:
        return 'bg-white/40 border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-800/20';
    }
  };

  return (
    <aside className="w-80 h-screen border-l border-slate-200/50 dark:border-slate-800/30 flex flex-col p-6 glass-premium z-10 select-none overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-outfit uppercase tracking-wider">
          Multi-Agent Core
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Live execution progress logs
        </p>
      </div>

      {/* Agent Cards */}
      <div className="space-y-4 flex-1">
        <AnimatePresence>
          {agents.map((agent) => {
            const isRunning = agent.status === 'running';
            const isCompleted = agent.status === 'completed';
            const colorClass = isRunning
              ? 'text-brand-500'
              : isCompleted
              ? 'text-emerald-500'
              : 'text-slate-400 dark:text-slate-500';

            return (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-2xl border transition-all duration-300 ${getCardBg(
                  agent.status
                )}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl flex items-center justify-center ${
                        isRunning
                          ? 'bg-brand-500/10 dark:bg-brand-500/20'
                          : isCompleted
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800/60'
                      }`}
                    >
                      {getIcon(agent.id, colorClass)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {agent.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize mt-0.5 font-medium">
                        {agent.status}
                      </p>
                    </div>
                  </div>
                  {getStatusIcon(agent.status)}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {agent.description}
                </p>

                {/* Progress Bar & Detail label */}
                {(isRunning || isCompleted) && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5 font-semibold">
                      <span className="truncate max-w-[150px]">{agent.details || 'Processing...'}</span>
                      <span>{agent.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-brand-600 to-sky-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${agent.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Running Orchestration Indicator */}
      <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/30">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 flex items-center space-x-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            All agents standby (Ready)
          </div>
        </div>
      </div>
    </aside>
  );
};
