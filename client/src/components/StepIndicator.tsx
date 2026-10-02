import React from 'react';
import { Check } from 'lucide-react';
import type { CreationStep } from '../types';

interface StepIndicatorProps {
  currentStep: CreationStep;
  onStepClick?: (step: CreationStep) => void;
  canNavigateToStep?: (step: CreationStep) => boolean;
}

const STEPS = [
  { number: 1 as CreationStep, title: 'Describe' },
  { number: 2 as CreationStep, title: 'Generate' },
  { number: 3 as CreationStep, title: 'Review' },
  { number: 4 as CreationStep, title: 'Download' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  canNavigateToStep,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto py-4 px-2">
      <div className="relative flex items-center justify-between">
        {/* Background connecting line */}
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0" />

        {/* Dynamic progress bar fill */}
        <div
          className="absolute top-5 left-8 h-0.5 bg-purple-600 transition-all duration-500 ease-out -z-0"
          style={{
            width: `${((Math.min(currentStep, 4) - 1) / (STEPS.length - 1)) * 88}%`,
          }}
        />

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = canNavigateToStep ? canNavigateToStep(step.number) : step.number <= currentStep;

          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center group">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.number)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-purple-600 text-white shadow-xs shadow-purple-600/30 ring-4 ring-purple-100 cursor-pointer'
                    : isCurrent
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 ring-4 ring-purple-100 scale-105'
                    : 'bg-white text-slate-400 border-2 border-slate-200 cursor-default'
                } ${isClickable && !isCurrent ? 'hover:border-purple-400 hover:text-purple-600' : ''}`}
                aria-label={`Step ${step.number}: ${step.title}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <span>{step.number}</span>
                )}
              </button>
              <span
                className={`mt-2 text-xs font-semibold tracking-wide transition-colors ${
                  isCurrent
                    ? 'text-purple-700 font-bold'
                    : isCompleted
                    ? 'text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
