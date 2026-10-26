import React from "react";
import { Info } from "lucide-react";

export const AssumptionsStrip: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-3.5 py-2 text-[11px] sm:text-xs shadow-xs">
      <div className="flex items-start sm:items-center gap-2 max-w-7xl mx-auto w-full leading-relaxed">
        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="font-semibold text-slate-300">Model Assumptions:</span>
          <span className="text-slate-400">
            Cutoff 09:00 UK, D-1 &bull; Error = actual − forecast (negative = forecast too high) &bull;
            Decisions Jan 1–31, 2026 &bull; WINDFOR hourly mapped to half-hours.
          </span>
        </div>
      </div>
    </div>
  );
};
