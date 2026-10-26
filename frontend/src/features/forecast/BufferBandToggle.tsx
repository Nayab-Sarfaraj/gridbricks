import React from "react";

export type BandViewMode = "conservative" | "debiased" | "both";

interface BufferBandToggleProps {
  bandView: BandViewMode;
  onBandViewChange: (mode: BandViewMode) => void;
  suggestedBufferP95: number;
  debiasedBufferP95: number;
  cutoffTime: string;
}

export const BufferBandToggle: React.FC<BufferBandToggleProps> = ({
  bandView,
  onBandViewChange,
  suggestedBufferP95,
  debiasedBufferP95,
  cutoffTime,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        <span className="font-semibold text-slate-700 shrink-0">Buffer View:</span>
        <div className="grid grid-cols-3 sm:inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 w-full sm:w-auto">
          <button
            onClick={() => onBandViewChange("conservative")}
            className={`px-2 py-1 rounded-md text-center font-medium transition-all text-[11px] sm:text-xs ${
              bandView === "conservative"
                ? "bg-white text-amber-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="hidden md:inline">Conservative ({Math.round(suggestedBufferP95)} MW)</span>
            <span className="md:hidden">Conservative</span>
          </button>
          <button
            onClick={() => onBandViewChange("debiased")}
            className={`px-2 py-1 rounded-md text-center font-medium transition-all text-[11px] sm:text-xs ${
              bandView === "debiased"
                ? "bg-white text-indigo-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="hidden md:inline">Bias-Corrected ({Math.round(debiasedBufferP95)} MW)</span>
            <span className="md:hidden">Debiased</span>
          </button>
          <button
            onClick={() => onBandViewChange("both")}
            className={`px-2 py-1 rounded-md text-center font-medium transition-all text-[11px] sm:text-xs ${
              bandView === "both"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="hidden md:inline">Both Bands</span>
            <span className="md:hidden">Both</span>
          </button>
        </div>
      </div>

      <div className="text-slate-500 text-[11px] text-right sm:text-left">
        Decision Cutoff:{" "}
        <strong className="text-slate-700 font-mono">
          {new Date(cutoffTime).toLocaleTimeString("en-GB", {
            timeZone: "Europe/London",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          UK (D-1)
        </strong>
      </div>
    </div>
  );
};
