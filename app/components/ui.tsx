"use client";
import type { ReactNode } from "react";

export function Btn({
  onClick,
  disabled,
  children,
  variant = "primary",
  className = "",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-[#49de80] text-gray-950 hover:bg-[#3bcc73] font-medium",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "border border-red-200 text-red-600 hover:bg-red-50",
    ghost: "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
  };
  return (
    <button
      className={`px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white overflow-hidden ${className}`}>
      {title && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
      <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      {label}
    </div>
  );
}

export function ScoreChip({ n }: { n: number }) {
  const cls =
    n >= 80
      ? "bg-[#49de80]/20 text-green-800"
      : n >= 50
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {n}/100
    </span>
  );
}

export function GradeChip({ n }: { n: number }) {
  const cls = n >= 8 ? "text-green-700" : n >= 5 ? "text-yellow-600" : "text-red-600";
  return <span className={`font-bold text-sm ${cls}`}>{n}/10</span>;
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-start ml-1">
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[9px] font-bold cursor-default select-none leading-none -mt-1">
        i
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-relaxed">
        {text}
      </span>
    </span>
  );
}

export function StepSection({
  step,
  title,
  tooltip,
  children,
}: {
  step: number;
  title: string;
  tooltip?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-gray-200 rounded-xl p-6 space-y-4 bg-white">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#49de80] text-gray-950 text-sm font-semibold shrink-0">
          {step}
        </span>
        <h2 className="text-base font-semibold text-gray-900">
          {title}
          {tooltip && <InfoTip text={tooltip} />}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
      {message}
    </div>
  );
}
