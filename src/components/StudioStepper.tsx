import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/stores/useStudioStore";

const steps = [
  { id: 1, name: "Choose Frame", description: "Select your frame style" },
  { id: 2, name: "Take Photo", description: "Capture your photo" },
  { id: 3, name: "Preview & Save", description: "Edit and download" },
];

export const StudioStepper = () => {
  const { frameSrc, photoDataUrl } = useStudioStore();
  
  const getCurrentStep = () => {
    if (!frameSrc) return 1;
    if (!photoDataUrl) return 2;
    return 3;
  };

  const currentStep = getCurrentStep();

  return (
    <nav 
      className="w-full py-4" 
      role="progressbar" 
      aria-valuenow={currentStep} 
      aria-valuemin={1} 
      aria-valuemax={3}
      aria-label="Photo creation progress"
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  step.id < currentStep
                    ? "border-success bg-success text-success-foreground"
                    : step.id === currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
                aria-current={step.id === currentStep ? "step" : undefined}
                role="button"
                tabIndex={0}
              >
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" aria-label="Completed" />
                ) : (
                  <span aria-label={`Step ${step.id}`}>{step.id}</span>
                )}
              </div>
              <div className="ml-2 flex flex-col">
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    step.id <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
              </div>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 sm:mx-4 h-px w-6 sm:w-8 transition-colors",
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
    </nav>
  );
};