import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useStudioStore } from "@/stores/useStudioStore";
import { toast } from "@/hooks/use-toast";

interface ResetControlsProps {
  variant?: 'button' | 'icon-button';
}

export const ResetControls = ({ variant = 'button' }: ResetControlsProps) => {
  const { 
    mode,
    activeSlot,
    setZoom,
    setOffset,
    setLeftZoom,
    setLeftOffset,
    setRightZoom,
    setRightOffset
  } = useStudioStore();
  
  const handleReset = () => {
    if (mode === 'portrait') {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } else {
      if (activeSlot === 'left') {
        setLeftZoom(1);
        setLeftOffset({ x: 0, y: 0 });
      } else {
        setRightZoom(1);
        setRightOffset({ x: 0, y: 0 });
      }
    }
    
    toast({
      title: "Reset complete",
      description: `${mode === 'portrait' ? 'Photo' : `${activeSlot} photo`} position and zoom reset to default`,
    });
  };
  
  if (variant === 'icon-button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        title="Reset position and zoom (0)"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    );
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      className="gap-2"
      title="Reset position and zoom (0)"
    >
      <RotateCcw className="h-4 w-4" />
      <span className="hidden sm:inline">Reset</span>
    </Button>
  );
};