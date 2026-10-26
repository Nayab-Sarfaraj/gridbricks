import React from "react";
import { cn } from "../../lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
  variant?: "default" | "warning" | "success" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  variant = "default",
  icon,
  className,
}) => {
  const variantStyles = {
    default: "border-slate-200 bg-white text-slate-900 shadow-sm",
    warning: "border-amber-200 bg-amber-50/50 text-amber-950 shadow-sm",
    success: "border-emerald-200 bg-emerald-50/50 text-emerald-950 shadow-sm",
    neutral: "border-slate-200 bg-slate-50 text-slate-800",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 sm:p-4.5 transition-all hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium text-slate-500 mb-1">
        <span className="truncate pr-1">{label}</span>
        {icon && <div className="text-slate-400 shrink-0">{icon}</div>}
      </div>
      <div className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
        {value}
      </div>
      {subtext && (
        <div className="mt-1 text-[10px] sm:text-xs text-slate-500 leading-snug line-clamp-2">
          {subtext}
        </div>
      )}
    </div>
  );
};
