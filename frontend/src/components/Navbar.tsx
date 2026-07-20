import React from 'react';
import { Bell, ShieldCheck, Menu } from 'lucide-react';

interface NavbarProps {
  currentTripName: string;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTripName, onToggleSidebar }) => {
  return (
    <header className="h-20 border-b border-slate-200/50 dark:border-slate-800/30 flex items-center justify-between px-8 glass-premium z-10 select-none">
      {/* Title & Toggle */}
      <div className="flex items-center space-x-3">
        {/* Burger menu toggle button for desktop and mobile */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/20 text-slate-500 dark:text-slate-400 outline-none cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
        
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-outfit ml-1">
          {currentTripName || "Dashboard"}
        </h2>
        <div className="hidden sm:flex items-center space-x-1.5 py-1 px-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>Multi-Agent System Active</span>
        </div>
      </div>

      {/* Profile and Actions */}
      <div className="flex items-center space-x-6">


        {/* Notification Icon */}
        <div className="relative p-2.5 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/20 cursor-pointer border border-transparent hover:border-slate-200/20 transition-all">
          <Bell className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900"></span>
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-[1px] bg-slate-200/80 dark:bg-slate-800/40"></div>

        {/* Profile Avatar */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group-hover:border-brand-500/50 transition-colors">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256"
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden lg:block text-left select-none">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 transition-colors">
              Guest User
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Premium Tier
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
