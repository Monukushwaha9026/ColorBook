import React from 'react';
import { Check } from 'lucide-react';
import type { AgeGroupId } from '../types';
import { AGE_GROUPS } from '../data/mockData';

interface AgeGroupSelectorProps {
  selectedAgeGroup: AgeGroupId;
  onSelect: (ageGroupId: AgeGroupId) => void;
  disabled?: boolean;
}

export const AgeGroupSelector: React.FC<AgeGroupSelectorProps> = ({
  selectedAgeGroup,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-sm sm:text-base font-bold text-slate-900">
          Target Age Group
        </label>
        <span className="text-xs text-slate-500 font-medium">
          Adjusts line thickness & complexity
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {AGE_GROUPS.map((group) => {
          const isSelected = selectedAgeGroup === group.id;

          return (
            <button
              key={group.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(group.id)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 text-center cursor-pointer group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/80 shadow-xs shadow-purple-500/10 ring-2 ring-purple-200/50'
                  : 'border-slate-200/90 bg-white hover:border-purple-300 hover:bg-slate-50/70'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              aria-pressed={isSelected}
            >
              {/* Checkmark badge when selected */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              )}

              {/* Graphic Icon */}
              <div className="w-12 h-12 mb-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <img
                  src={group.iconSrc}
                  alt={group.label}
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>

              {/* Title & Age Range */}
              <p
                className={`text-sm font-bold transition-colors ${
                  isSelected ? 'text-purple-950 font-extrabold' : 'text-slate-800'
                }`}
              >
                {group.label}
              </p>
              <p
                className={`text-xs font-semibold mt-0.5 ${
                  isSelected ? 'text-purple-700' : 'text-slate-500'
                }`}
              >
                {group.range}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
