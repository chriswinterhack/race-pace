"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  currentStep: number;
  steps: string[];
  onStepClick?: (step: number) => void;
}

export function WizardProgress({
  currentStep,
  steps,
  onStepClick,
}: WizardProgressProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop Progress */}
      <ol className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isClickable = onStepClick && stepNumber <= currentStep;

          return (
            <li key={step} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(stepNumber)}
                  disabled={!isClickable}
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted && "bg-brand-sky-500 border-brand-sky-500 text-white",
                    isCurrent && "border-brand-sky-500 bg-white text-brand-sky-600",
                    !isCompleted && !isCurrent && "border-brand-navy-200 bg-white text-brand-navy-400",
                    isClickable && "cursor-pointer hover:bg-brand-sky-50"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </button>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px]",
                    isCurrent && "text-brand-sky-600",
                    isCompleted && "text-brand-navy-700",
                    !isCompleted && !isCurrent && "text-brand-navy-400"
                  )}
                >
                  {step}
                </span>
              </div>
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5",
                    stepNumber < currentStep
                      ? "bg-brand-sky-500"
                      : "bg-brand-navy-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile Progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-brand-navy-900">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-brand-sky-600 font-medium">
            {steps[currentStep - 1]}
          </span>
        </div>
        <div className="h-2 bg-brand-navy-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-sky-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </nav>
  );
}
