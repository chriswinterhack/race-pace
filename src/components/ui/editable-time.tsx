"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableTimeProps {
  value: number; // minutes
  onChange: (minutes: number) => void;
  className?: string;
  disabled?: boolean;
}

export function EditableTime({ value, onChange, className, disabled }: EditableTimeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [hours, setHours] = useState(Math.floor(value / 60));
  const [minutes, setMinutes] = useState(value % 60);
  const hoursInputRef = useRef<HTMLInputElement>(null);

  // Sync state when value changes externally
  useEffect(() => {
    if (!isEditing) {
      setHours(Math.floor(value / 60));
      setMinutes(value % 60);
    }
  }, [value, isEditing]);

  const formatDisplay = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}`;
    }
    return `${m}m`;
  };

  const handleStartEdit = () => {
    if (disabled) return;
    setHours(Math.floor(value / 60));
    setMinutes(value % 60);
    setIsEditing(true);
    setTimeout(() => hoursInputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes > 0 && totalMinutes !== value) {
      onChange(totalMinutes);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setHours(Math.floor(value / 60));
    setMinutes(value % 60);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center bg-white border-2 border-brand-sky-400 rounded-lg overflow-hidden shadow-lg">
          <input
            ref={hoursInputRef}
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
            onKeyDown={handleKeyDown}
            className="w-10 px-2 py-1.5 text-center font-mono font-bold text-brand-navy-900 focus:outline-none"
          />
          <span className="text-brand-navy-400 font-bold">:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={minutes.toString().padStart(2, "0")}
            onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            onKeyDown={handleKeyDown}
            className="w-10 px-2 py-1.5 text-center font-mono font-bold text-brand-navy-900 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSave}
          className="p-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-md bg-brand-navy-200 text-brand-navy-600 hover:bg-brand-navy-300 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      disabled={disabled}
      className={cn(
        "group flex items-center gap-1.5 font-mono font-bold transition-colors",
        !disabled && "hover:text-brand-sky-600 cursor-pointer",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {formatDisplay(value)}
      {!disabled && (
        <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-brand-sky-500 transition-opacity" />
      )}
    </button>
  );
}
