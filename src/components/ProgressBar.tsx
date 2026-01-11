import React from 'react';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: { id: number; title: string; description: string }[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, steps }) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between mb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center relative ${
                step.id < currentStep
                  ? 'text-blue-600'
                  : step.id === currentStep
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-400'
              }`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                    step.id < currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : step.id === currentStep
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check size={20} />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <span className="text-xs hidden md:block">{step.title}</span>
              </div>
              {step.id < totalSteps && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-0.5 ${
                    step.id < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  style={{ transform: 'translateY(-50%)' }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
