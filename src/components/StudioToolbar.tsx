import { Button } from "@/components/ui/button";
import { Toolbar, ToolbarItem, ToolbarSeparator } from "@/components/ui/toolbar";
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Download, Smartphone, Monitor } from "lucide-react";
import { useStudioStore } from "@/stores/useStudioStore";
import { exportImage } from "@/lib/exportImage";
import { toast } from "@/hooks/use-toast";

interface StudioToolbarProps {
  onBack?: () => void;
}

const StudioToolbar = ({ onBack }: StudioToolbarProps) => {
  const { 
    mode, 
    frameSrc, 
    photoDataUrl, 
    leftPhotoDataUrl, 
    rightPhotoDataUrl, 
    activeSlot,
    zoom, 
    offset, 
    leftZoom, 
    leftOffset, 
    rightZoom, 
    rightOffset,
    setZoom, 
    setOffset,
    setLeftZoom,
    setLeftOffset,
    setRightZoom,
    setRightOffset
  } = useStudioStore();

  // Get current slot controls
  const getCurrentControls = () => {
    if (mode === 'portrait') {
      return { zoom, offset, setZoom, setOffset };
    } else {
      return activeSlot === 'left'
        ? { zoom: leftZoom, offset: leftOffset, setZoom: setLeftZoom, setOffset: setLeftOffset }
        : { zoom: rightZoom, offset: rightOffset, setZoom: setRightZoom, setOffset: setRightOffset };
    }
  };

  const { zoom: currentZoom, offset: currentOffset, setZoom: setCurrentZoom, setOffset: setCurrentOffset } = getCurrentControls();

  const handleZoomIn = () => {
    setCurrentZoom(Math.min(3, currentZoom + 0.1));
  };

  const handleZoomOut = () => {
    setCurrentZoom(Math.max(1, currentZoom - 0.1));
  };

  const handleReset = () => {
    setCurrentOffset({ x: 0, y: 0 });
    setCurrentZoom(1);
  };

  const handleSave = async () => {
    const hasPhotos = mode === 'portrait' ? !!photoDataUrl : !!(leftPhotoDataUrl && rightPhotoDataUrl);
    
    if (!hasPhotos || !frameSrc) {
      toast({
        title: "Error",
        description: mode === 'portrait' ? "No photo or frame selected" : "Both photos and frame must be selected",
        variant: "destructive",
      });
      return;
    }

    try {
      if (mode === 'portrait') {
        await exportImage(photoDataUrl!, frameSrc, mode, zoom, offset, {
          format: 'png',
          quality: 0.9
        });
      } else {
        // For landscape, we'll need to update exportImage to handle dual photos
        await exportImage(rightPhotoDataUrl!, frameSrc, mode, rightZoom, rightOffset, {
          format: 'png',
          quality: 0.9,
          leftPhoto: leftPhotoDataUrl!,
          leftZoom,
          leftOffset
        });
      }
      
      toast({
        title: "Saved!",
        description: "Your photo has been downloaded successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to save your photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onBack?.();
    }
  };

  return (
    <Toolbar 
      className="bg-background/95 backdrop-blur-sm border shadow-md flex-wrap gap-1 p-2 sm:p-1 sm:gap-1"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="toolbar"
      aria-label="Photo editing toolbar"
    >
      <ToolbarItem>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="shrink-0"
          aria-label="Go back to previous step"
        >
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </ToolbarItem>
      
      <ToolbarSeparator className="hidden sm:block" />
      
      <ToolbarItem className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={currentZoom <= 1}
          aria-label="Zoom out"
          title="Zoom out (-)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-sm text-muted-foreground min-w-[3rem] text-center px-2">
          {Math.round(currentZoom * 100)}%
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={currentZoom >= 3}
          aria-label="Zoom in"
          title="Zoom in (+)"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </ToolbarItem>
      
      <ToolbarSeparator className="hidden sm:block" />
      
      <ToolbarItem>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          aria-label="Reset position and zoom"
          title="Reset (0)"
        >
          <RotateCcw className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </ToolbarItem>
      
      <ToolbarSeparator className="hidden sm:block" />
      
      <ToolbarItem>
        <Button 
          variant="gradient" 
          size="sm" 
          onClick={handleSave}
          aria-label="Save and download photo"
          className="shrink-0"
        >
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Save</span>
        </Button>
      </ToolbarItem>

      {/* Mobile indicator */}
      <ToolbarItem className="sm:hidden ml-auto">
        <div className="flex items-center text-xs text-muted-foreground">
          <Smartphone className="h-3 w-3" />
        </div>
      </ToolbarItem>
    </Toolbar>
  );
};

export default StudioToolbar;