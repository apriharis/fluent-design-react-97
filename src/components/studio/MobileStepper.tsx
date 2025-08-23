import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/stores/useStudioStore";

const steps = [
  { id: 1, name: "Frame", short: "1" },
  { id: 2, name: "Photo", short: "2" },
  { id: 3, name: "Save", short: "3" },
];

interface MobileStepperProps {
  className?: string;
}

export const MobileStepper = ({ className = "" }: MobileStepperProps) => {
  const { frameSrc, photoDataUrl, leftPhotoDataUrl, rightPhotoDataUrl, mode } = useStudioStore();
  
  const getCurrentStep = () => {
    if (!frameSrc) return 1;
    
    if (mode === 'portrait') {
      if (!photoDataUrl) return 2;
      return 3;
    } else {
      // Landscape mode - need both photos
      if (!rightPhotoDataUrl || !leftPhotoDataUrl) return 2;
      return 3;
    }
  };

  const currentStep = getCurrentStep();

  return (
    <div className={`overflow-x-auto scrollbar-hide ${className}`}>
      <div className="flex items-center justify-center gap-2 min-w-max px-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium transition-colors shrink-0",
                step.id < currentStep
                  ? "border-success bg-success text-success-foreground"
                  : step.id === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 bg-background text-muted-foreground"
              )}
              aria-current={step.id === currentStep ? "step" : undefined}
            >
              {step.id < currentStep ? (
                <Check className="h-3 w-3" />
              ) : (
                <span>{step.short}</span>
              )}
            </div>
            
            <span 
              className={cn(
                "ml-1 text-xs font-medium transition-colors whitespace-nowrap",
                step.id <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.name}
            </span>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-px w-6 transition-colors shrink-0",
                  step.id < currentStep
                    ? "bg-success"
                    : "bg-muted-foreground/30"
                )}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};