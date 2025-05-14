
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  target: string;
  content: string;
  position: 'top' | 'right' | 'bottom' | 'left';
}

interface OnboardingTourProps {
  onComplete: () => void;
  websiteUrl: string;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, websiteUrl }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const { toast } = useToast();

  const steps: OnboardingStep[] = [
    {
      target: 'campaign-recommendations',
      content: 'Here are the three most relevant channels we\'ve identified for your business. Click on one to generate a marketing plan.',
      position: 'top'
    },
    {
      target: 'reddit-icon',
      content: 'Click here to launch an Ad campaign on Reddit.',
      position: 'left'
    }
  ];

  useEffect(() => {
    // Check if this particular website has been onboarded before
    const analyzedWebsites = JSON.parse(localStorage.getItem('analyzedWebsites') || '[]');
    if (websiteUrl && analyzedWebsites.includes(websiteUrl)) {
      // Website already onboarded, skip tour
      setIsVisible(false);
      onComplete();
    }
  }, [websiteUrl, onComplete]);

  // Position the tooltip based on the target element
  useEffect(() => {
    if (!isVisible) return;

    const positionTooltip = () => {
      const targetElement = document.getElementById(steps[currentStep].target);
      const tooltipElement = document.getElementById('onboarding-tooltip');

      if (!targetElement || !tooltipElement) return;

      const targetRect = targetElement.getBoundingClientRect();
      const position = steps[currentStep].position;

      // Add highlight effect to target
      targetElement.classList.add('ring-4', 'ring-marketing-purple', 'ring-opacity-70', 'z-30');

      // Position tooltip based on specified position
      switch (position) {
        case 'top':
          tooltipElement.style.top = `${targetRect.top - tooltipElement.offsetHeight - 12}px`;
          tooltipElement.style.left = `${targetRect.left + (targetRect.width / 2) - (tooltipElement.offsetWidth / 2)}px`;
          break;
        case 'right':
          tooltipElement.style.top = `${targetRect.top + (targetRect.height / 2) - (tooltipElement.offsetHeight / 2)}px`;
          tooltipElement.style.left = `${targetRect.right + 12}px`;
          break;
        case 'bottom':
          tooltipElement.style.top = `${targetRect.bottom + 12}px`;
          tooltipElement.style.left = `${targetRect.left + (targetRect.width / 2) - (tooltipElement.offsetWidth / 2)}px`;
          break;
        case 'left':
          tooltipElement.style.top = `${targetRect.top + (targetRect.height / 2) - (tooltipElement.offsetHeight / 2)}px`;
          tooltipElement.style.left = `${targetRect.left - tooltipElement.offsetWidth - 12}px`;
          break;
      }
    };

    // Wait for elements to be fully rendered
    setTimeout(positionTooltip, 100);

    return () => {
      // Remove highlight effect from all elements when changing steps
      document.querySelectorAll('.ring-4').forEach(el => {
        el.classList.remove('ring-4', 'ring-marketing-purple', 'ring-opacity-70', 'z-30');
      });
    };
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    toast({
      title: "Onboarding skipped",
      description: "You can always explore the dashboard at your own pace.",
    });
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    
    // Add this website to the list of analyzed websites
    if (websiteUrl) {
      const analyzedWebsites = JSON.parse(localStorage.getItem('analyzedWebsites') || '[]');
      if (!analyzedWebsites.includes(websiteUrl)) {
        analyzedWebsites.push(websiteUrl);
        localStorage.setItem('analyzedWebsites', JSON.stringify(analyzedWebsites));
      }
    }
    
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-20" 
        onClick={handleSkip}
      />
      
      {/* Tooltip */}
      <div 
        id="onboarding-tooltip"
        className="fixed p-5 bg-white rounded-lg shadow-lg border border-marketing-purple/30 z-50 w-64 md:w-80 transition-all duration-300"
      >
        <button 
          onClick={handleSkip}
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>
        
        <div className="mb-4 text-gray-800">
          {steps[currentStep].content}
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </span>
          <div className="space-x-2">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-marketing-purple text-white rounded hover:bg-marketing-purple/80 text-sm"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
