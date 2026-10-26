import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  caption?: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  caption,
  isLoading,
  isError,
  error,
  onRetry,
  headerAction,
  children,
  className = "",
}) => {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-1.5">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{title}</h3>
          {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      <div className="pt-3 sm:pt-4 min-h-[260px] sm:min-h-[320px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-sky-500" />
            <span className="text-xs font-medium">Loading dataset...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <div className="text-sm font-semibold text-slate-800">Failed to load chart data</div>
            <div className="text-xs text-slate-500 max-w-sm">
              {error?.message || "An unexpected error occurred while communicating with the API."}
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </div>

      {caption && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 italic leading-relaxed">
          {caption}
        </div>
      )}
    </div>
  );
};
