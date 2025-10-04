import React, { useState } from 'react';

import { ChevronLeft, ChevronRight, HelpCircle, Pause,Play } from 'lucide-react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

interface HelpStep {
  id: string;
  title: string;
  content: string;
  image?: string;
  action?: string;
}

const HELP_STEPS: HelpStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FlowTrace',
    content: 'FlowTrace is a powerful blockchain transaction visualization tool. This tutorial will guide you through the main features.',
    action: 'Let\'s get started!'
  },
  {
    id: 'tracing',
    title: 'Tracing Addresses',
    content: 'Enter any Bitcoin address or transaction hash in the search bar and click "Trace" to visualize the transaction flow. You can also press Enter to trace.',
    action: 'Try tracing an address now!'
  },
  {
    id: 'nodes',
    title: 'Understanding Nodes',
    content: 'Nodes represent addresses or entities. Different colors indicate different types: wallets, exchanges, mixers, etc. Click on a node to see detailed information.',
    action: 'Click on a node to explore!'
  },
  {
    id: 'connections',
    title: 'Transaction Connections',
    content: 'Lines between nodes show transactions. Click on a connection to customize its color. This helps you track specific transaction flows.',
    action: 'Try clicking on a connection!'
  },
  {
    id: 'drawing',
    title: 'Drawing Tools',
    content: 'Use the drawing toolbar (palette icon) to add annotations, shapes, and notes to your analysis. Perfect for marking important patterns.',
    action: 'Open the drawing toolbar!'
  },
  {
    id: 'custom-nodes',
    title: 'Custom Nodes',
    content: 'Double-click on empty nodes to rename them. Add custom nodes using the "+" button in the toolbar for better organization.',
    action: 'Try adding a custom node!'
  },
  {
    id: 'notes',
    title: 'Adding Notes',
    content: 'Each node has a notes section where you can add observations, findings, or collaborate with team members.',
    action: 'Add a note to a node!'
  },
  {
    id: 'export',
    title: 'Export & Share',
    content: 'Use the connected node panel (bug icon) to export your analysis as JSON or import previous work. Great for collaboration!',
    action: 'Explore the connected node panel!'
  }
];

interface HelpSystemProps {
  className?: string;
}

export const HelpSystem: React.FC<HelpSystemProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const handleNext = () => {
    if (currentStep < HELP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Close dialog at the end
      setIsOpen(false);
      setCurrentStep(0);
      setIsAutoPlay(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
  };

  // Auto-play functionality
  React.useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      handleNext();
    }, 3000); // 3 seconds per step

    return () => clearInterval(interval);
  }, [isAutoPlay, currentStep]);

  const currentHelpStep = HELP_STEPS[currentStep];

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={`h-11 px-3 ${className}`}
        title="Help & Tutorial"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Interactive Tutorial
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Step {currentStep + 1} of {HELP_STEPS.length}</span>
                <Badge variant="secondary">{currentHelpStep.id}</Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / HELP_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{currentHelpStep.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {currentHelpStep.content}
                </p>
                
                {currentHelpStep.image && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <img
                      src={currentHelpStep.image}
                      alt={currentHelpStep.title}
                      className="max-w-full h-auto rounded"
                    />
                  </div>
                )}

                {currentHelpStep.action && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      💡 {currentHelpStep.action}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoPlay}
                  className="flex items-center gap-1"
                >
                  {isAutoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isAutoPlay ? 'Pause' : 'Auto-play'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentStep(0);
                    setIsAutoPlay(false);
                  }}
                >
                  Restart
                </Button>

                <Button
                  onClick={handleNext}
                  className="flex items-center gap-1"
                >
                  {currentStep === HELP_STEPS.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < HELP_STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
