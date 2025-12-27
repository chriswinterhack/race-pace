"use client";

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function QuickStat({ icon, label, value }: QuickStatProps) {
  return (
    <div className="py-4 px-4 sm:px-6 text-center">
      <div className="flex items-center justify-center gap-2 text-brand-sky-400 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-brand-navy-400">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
