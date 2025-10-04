import React, { useState, useEffect } from 'react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '.protocol-dashboard',
    title: '📊 Protocol State Dashboard',
    content: 'Monitor your UDS session status, security level, and active diagnostic mode in real-time.',
    position: 'bottom'
  },
  {
    target: '.request-builder',
    title: '🎯 Request Builder',
    content: 'Select a UDS service and build diagnostic requests. Hover over services to see detailed tooltips with examples and use cases.',
    position: 'bottom'
  },
  {
    target: '.quick-examples',
    title: '⚡ Quick Examples',
    content: 'Try pre-configured diagnostic scenarios with one click. Great for learning common UDS workflows.',
    position: 'left'
  },
  {
    target: '.response-visualizer',
    title: '📡 Response Visualizer',
    content: 'See ECU responses with byte-by-byte breakdown, color-coded syntax, and live timing metrics.',
    position: 'left'
  },
  {
    target: '.help-button',
    title: '❓ Need Help?',
    content: 'Access the help menu anytime for keyboard shortcuts, UDS reference, and to restart this tour.',
    position: 'bottom'
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  useEffect(() => {
    if (!isOpen) return;

    const step = tourSteps[currentStep];
    const targetElement = document.querySelector(step.target);
    
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      const offset = 20;

      let top = 0;
      let left = 0;
      let arrow: 'top' | 'bottom' | 'left' | 'right' = 'top';

      switch (step.position) {
        case 'bottom':
          top = rect.bottom + offset;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrow = 'top';
          break;
        case 'top':
          top = rect.top - tooltipHeight - offset;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrow = 'bottom';
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + offset;
          arrow = 'left';
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - offset;
          arrow = 'right';
          break;
      }

      // Keep tooltip within viewport bounds
      top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));
      left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));

      setPosition({ top, left });
      setArrowPosition(arrow);

      // Add highlight to target element
      targetElement.classList.add('tour-highlight');
    }

    return () => {
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
    };
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('uds-tour-completed', 'true');
    onClose();
    setCurrentStep(0);
  };

  const handleSkip = () => {
    localStorage.setItem('uds-tour-completed', 'true');
    onClose();
    setCurrentStep(0);
  };

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-40 animate-fade-in"
        onClick={handleSkip}
      />

      {/* Tour Tooltip */}
      <div
        className="fixed z-50 w-80 rounded-lg border-2 border-cyber-blue bg-dark-900/98 p-6 shadow-2xl animate-slide-up backdrop-blur-sm"
        style={{ top: position.top, left: position.left }}
      >
        {/* Arrow */}
        <div className={`absolute w-4 h-4 bg-dark-900 border-cyber-blue ${
          arrowPosition === 'top' ? 'border-t-2 border-l-2 -top-2 left-1/2 -translate-x-1/2 rotate-45' :
          arrowPosition === 'bottom' ? 'border-b-2 border-r-2 -bottom-2 left-1/2 -translate-x-1/2 rotate-45' :
          arrowPosition === 'left' ? 'border-l-2 border-b-2 -left-2 top-1/2 -translate-y-1/2 rotate-45' :
          'border-r-2 border-t-2 -right-2 top-1/2 -translate-y-1/2 rotate-45'
        }`} />

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-cyber-blue mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-1.5 justify-center">
            {tourSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-8 bg-cyber-blue' 
                    : idx < currentStep
                    ? 'w-1.5 bg-cyber-blue/50'
                    : 'w-1.5 bg-dark-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-dark-600">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-cyber-blue transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm bg-cyber-blue text-black font-semibold rounded hover:bg-cyber-blue/80 transition-colors"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
