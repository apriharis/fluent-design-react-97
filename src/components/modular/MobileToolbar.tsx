import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { ExportControls } from "@/components/studio/ExportControls";
import { ResetControls } from "@/components/studio/ResetControls";
import { useStudioStore } from "@/stores/useStudioStore";

interface MobileToolbarProps {
  onBack?: () => void;
}

export const MobileToolbar = ({ onBack }: MobileToolbarProps) => {
  const { 
    mode, 
    activeSlot,
    zoom, 
    leftZoom, 
    rightZoom,
    setZoom, 
    setLeftZoom,
    setRightZoom
  } = useStudioStore();

  // Get current zoom for display
  const getCurrentZoom = () => {
    if (mode === 'portrait') return zoom;
    return activeSlot === 'left' ? leftZoom : rightZoom;
  };

  const getCurrentSetZoom = () => {
    if (mode === 'portrait') return setZoom;
    return activeSlot === 'left' ? setLeftZoom : setRightZoom;
  };

  const currentZoom = getCurrentZoom();
  const setCurrentZoom = getCurrentSetZoom();

  const handleZoomIn = () => {
    setCurrentZoom(Math.min(3, currentZoom + 0.1));
  };

  const handleZoomOut = () => {
    setCurrentZoom(Math.max(1, currentZoom - 0.1));
  };

  return (
    <div className="flex items-center justify-between w-full gap-2">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBack}
        className="shrink-0"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      
      {/* Zoom Controls */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={currentZoom <= 1}
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        
        <span className="text-xs text-muted-foreground min-w-[2.5rem] text-center">
          {Math.round(currentZoom * 100)}%
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={currentZoom >= 3}
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Reset */}
      <ResetControls variant="icon-button" />
      
      {/* Export */}
      <ExportControls />
    </div>
  );
};