import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  minDate = "2026-01-02",
  maxDate = "2026-02-01",
}) => {
  // Generate all dates in the Jan 2 to Feb 1 delivery window
  const dates: string[] = [];
  const current = new Date(`${minDate}T00:00:00Z`);
  const end = new Date(`${maxDate}T00:00:00Z`);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  const currentIndex = dates.indexOf(selectedDate);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < dates.length - 1;

  const handlePrev = () => {
    if (canGoPrev) onDateChange(dates[currentIndex - 1]);
  };

  const handleNext = () => {
    if (canGoNext) onDateChange(dates[currentIndex + 1]);
  };

  return (
    <div className="flex items-center justify-between w-full sm:w-auto bg-white border border-slate-200 rounded-lg p-1.5 shadow-xs">
      <button
        onClick={handlePrev}
        disabled={!canGoPrev}
        title="Previous delivery day"
        className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center space-x-1.5 px-2 flex-1 justify-center sm:justify-start">
        <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
        <select
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="text-xs font-semibold text-slate-900 bg-transparent cursor-pointer focus:outline-hidden py-0.5 text-center sm:text-left"
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleNext}
        disabled={!canGoNext}
        title="Next delivery day"
        className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
