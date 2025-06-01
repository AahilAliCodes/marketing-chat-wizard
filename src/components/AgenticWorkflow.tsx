import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface AgenticWorkflowProps {
  isVisible: boolean;
  isComplete?: boolean;
  onComplete?: () => void;
  embedded?: boolean;
}

const generationSteps = [
  "Analyzing website content...",
  "Searching high-signal subreddits...",
  "Scoring engagement levels...",
  "Generating recommendations...",
  "Finalizing post ideas..."
];

const AgenticWorkflow: React.FC<AgenticWorkflowProps> = ({ 
  isVisible, 
  isComplete = false, 
  onComplete,
  embedded = false 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setProgress(0);
      setHasCompleted(false);
      return;
    }

    const stepDuration = 2000; // 2 seconds per step
    const totalSteps = generationSteps.length;

    // If the generation is complete, fast-forward to the end
    if (isComplete && !hasCompleted) {
      setCurrentStep(totalSteps - 1);
      setProgress(100);
      setHasCompleted(true);
      setTimeout(() => {
        onComplete?.();
      }, 500);
      return;
    }

    // Progress through steps normally
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;
        if (nextStep >= totalSteps) {
          clearInterval(stepInterval);
          return totalSteps - 1; // Stay at last step
        }
        return nextStep;
      });
    }, stepDuration);

    // Continuous smooth progress animation that always moves forward
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Calculate target progress based on current step
        const baseProgress = (currentStep / totalSteps) * 100;
        let targetProgress = Math.min(baseProgress + 20, 100); // Always ahead of step progress
        
        // If we're past 72% and not complete yet, slow down but keep moving
        if (prev >= 72 && !isComplete) {
          // Very slow but continuous progress
          const increment = 0.1 + Math.random() * 0.2; // Random between 0.1-0.3%
          targetProgress = Math.min(prev + increment, 99.5); // Cap at 99.5% until complete
        } else if (isComplete) {
          // Jump to 100% when complete
          targetProgress = 100;
        } else {
          // Normal progress rate before 72%
          const increment = 1 + Math.random() * 1; // Random between 1-2%
          targetProgress = Math.min(prev + increment, targetProgress);
        }
        
        // If we reach 100% and generation is complete, trigger completion
        if (targetProgress >= 100 && isComplete && !hasCompleted) {
          setHasCompleted(true);
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }
        
        return targetProgress;
      });
    }, 150); // Update every 150ms for smooth animation

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isVisible, isComplete, onComplete, hasCompleted, currentStep]);

  if (!isVisible) return null;

  const WorkflowContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          AI Agent Working
        </h3>
        <p className="text-gray-600 text-sm">
          Analyzing your website and generating recommendations...
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="text-xs text-gray-500 text-center">
          {Math.round(progress)}% Complete
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {generationSteps.map((step, index) => (
          <div 
            key={index}
            className={`flex items-center space-x-3 transition-all duration-500 ${
              index <= currentStep ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs transition-all duration-500 ${
              index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep 
                ? 'bg-marketing-purple text-white animate-pulse' 
                : 'bg-gray-200'
            }`}>
              {index < currentStep ? '✓' : index === currentStep ? '●' : '○'}
            </div>
            <span className={`text-sm transition-all duration-500 ${
              index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}>
              {step}
            </span>
            {index === currentStep && !isComplete && (
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-marketing-purple rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-marketing-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-marketing-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isComplete && hasCompleted && (
        <div className="text-center animate-fade-in">
          <div className="text-green-600 font-semibold">
            ✨ Generation Complete!
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        {/* Rocket Animation for embedded mode */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="animate-bounce">
              <div className="w-12 h-12 bg-gradient-to-r from-marketing-purple to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">🚀</span>
              </div>
            </div>
            {/* Fuel animation */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className="w-1 bg-gradient-to-b from-orange-400 to-red-500 animate-pulse" 
                   style={{ height: `${progress / 5}px` }}></div>
            </div>
          </div>
        </div>
        
        <WorkflowContent />
      </div>
    );
  }

  // Original overlay mode
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {/* Rocket Animation */}
        <div className="absolute right-4 top-4">
          <div className="relative">
            <div className="animate-bounce">
              <div className="w-12 h-12 bg-gradient-to-r from-marketing-purple to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">🚀</span>
              </div>
            </div>
            {/* Fuel animation */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className="w-1 bg-gradient-to-b from-orange-400 to-red-500 animate-pulse" 
                   style={{ height: `${progress / 5}px` }}></div>
            </div>
          </div>
        </div>

        <WorkflowContent />
      </div>
    </div>
  );
};

export default AgenticWorkflow;
