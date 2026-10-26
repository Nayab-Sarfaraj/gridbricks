import React from "react";
import { Activity, Wind } from "lucide-react";

interface HeaderProps {
  activeTab: "forecast" | "accuracy";
  onTabChange: (tab: "forecast" | "accuracy") => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 md:py-0 md:h-16 gap-2.5 md:gap-4">
          {/* Top Row: Logo & System Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                <Wind className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-base tracking-tight">
                    Gridbricks
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60 rounded-full px-2 py-0.5">
                    UK Day-Ahead Wind
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden xs:block">
                  Elexon BMRS Forecast & Buffer Sizing
                </p>
              </div>
            </div>

            {/* Live Indicator (shows on all screen sizes) */}
            <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-medium hidden sm:inline">BMRS Cached</span>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Navigation Tabs: Full width on mobile, inline on desktop */}
          <div className="grid grid-cols-2 md:flex items-center space-x-0 md:space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 w-full md:w-auto">
            <button
              onClick={() => onTabChange("forecast")}
              className={`px-3 py-1.5 text-xs text-center font-medium rounded-md transition-all ${
                activeTab === "forecast"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tomorrow's Forecast
            </button>
            <button
              onClick={() => onTabChange("accuracy")}
              className={`px-3 py-1.5 text-xs text-center font-medium rounded-md transition-all ${
                activeTab === "accuracy"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Forecast Accuracy
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
