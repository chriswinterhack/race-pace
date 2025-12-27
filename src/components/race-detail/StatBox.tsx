"use client";

interface StatBoxProps {
  label: string;
  value: string;
}

export function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="p-4 rounded-lg bg-brand-navy-50">
      <p className="text-xs font-medium text-brand-navy-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-brand-navy-900">{value}</p>
    </div>
  );
}
