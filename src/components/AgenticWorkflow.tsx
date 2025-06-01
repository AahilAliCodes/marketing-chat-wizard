import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

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

    const stepDuration = 5000; // 5 seconds per step
    const totalSteps = generationSteps.length;

    // Handle completion immediately when isComplete becomes true
    if (isComplete && !hasCompleted) {
      setCurrentStep(totalSteps - 1);
      setProgress(100);
      setHasCompleted(true);
      
      // Complete immediately when process is done
      setTimeout(() => {
        onComplete?.();
      }, 300);
      return;
    }

    // Step progression - advance steps every 5 seconds
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;
        if (nextStep >= totalSteps || isComplete) {
          clearInterval(stepInterval);
          return totalSteps - 1;
        }
        return nextStep;
      });
    }, stepDuration);

    // Progress bar - goes from 0 to 100 in 25 seconds (400ms intervals)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // If process is complete, jump to 100%
        if (isComplete) {
          return 100;
        }
        
        // Increment by 1% every 250ms to reach 100% in 25 seconds
        const increment = 1;
        const newProgress = Math.min(prev + increment, 100);
        
        // If we reach 100% but process isn't complete, stay at 99%
        if (newProgress >= 100 && !isComplete) {
          return 99;
        }
        
        return newProgress;
      });
    }, 250); // 250ms intervals for smooth animation

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isVisible, isComplete, onComplete, hasCompleted]);

  if (!isVisible) return null;

  const WorkflowContent = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center bg-gradient-to-r from-marketing-purple/10 to-purple-100 text-marketing-darkPurple font-medium px-4 py-2 rounded-full mb-4">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Agent Working
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-3 font-helvetica">
          Analyzing & Generating
        </h3>
        <p className="text-gray-600 leading-relaxed font-helvetica">
          Our AI is analyzing your website and generating personalized Reddit marketing recommendations
        </p>
      </div>

      <div className="space-y-4">
        <Progress value={progress} className="h-3 bg-gray-100" />
        <div className="text-sm text-gray-500 text-center font-medium font-helvetica">
          {Math.round(progress)}% Complete
        </div>
      </div>

      <div className="space-y-4">
        {generationSteps.map((step, index) => (
          <div 
            key={index}
            className={`flex items-center space-x-4 transition-all duration-500 ${
              index <= currentStep ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 shadow-modern ${
              index < currentStep 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-200' 
                : index === currentStep 
                ? 'bg-gradient-to-r from-marketing-purple to-marketing-darkPurple text-white animate-pulse shadow-purple-200' 
                : 'bg-gray-200 text-gray-400'
            }`}>
              {index < currentStep ? '✓' : index === currentStep ? '●' : '○'}
            </div>
            <span className={`text-sm transition-all duration-500 font-helvetica ${
              index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}>
              {step}
            </span>
            {index === currentStep && !isComplete && (
              <div className="flex space-x-1">
                {[0, 1, 2].map((dot) => (
                  <div 
                    key={dot}
                    className="w-1.5 h-1.5 bg-marketing-purple rounded-full animate-bounce" 
                    style={{ animationDelay: `${dot * 0.1}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {isComplete && hasCompleted && (
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-full font-helvetica">
            <Sparkles className="w-4 h-4 mr-2" />
            Generation Complete!
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="bg-white rounded-2xl shadow-modern-lg p-10 border border-gray-100">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="animate-bounce">
              <div className="w-14 h-14 bg-gradient-to-r from-marketing-purple to-marketing-darkPurple rounded-2xl flex items-center justify-center shadow-modern-lg">
                <span className="text-white text-3xl">🚀</span>
              </div>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <div className="w-1.5 bg-gradient-to-b from-orange-400 to-red-500 animate-pulse rounded-full" 
                   style={{ height: `${progress / 4}px` }}></div>
            </div>
          </div>
        </div>
        
        <WorkflowContent />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-modern-xl p-10 max-w-lg w-full relative overflow-hidden border border-gray-100">
        <div className="absolute right-6 top-6">
          <div className="relative">
            <div className="animate-bounce">
              <div className="w-14 h-14 bg-gradient-to-r from-marketing-purple to-marketing-darkPurple rounded-2xl flex items-center justify-center shadow-modern-lg">
                <span className="text-white text-3xl">🚀</span>
              </div>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <div className="w-1.5 bg-gradient-to-b from-orange-400 to-red-500 animate-pulse rounded-full" 
                   style={{ height: `${progress / 4}px` }}></div>
            </div>
          </div>
        </div>

        <WorkflowContent />
      </div>
    </div>
  );
};

export default AgenticWorkflow;
