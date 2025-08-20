import { Button } from "@/components/ui/button";
import { Toolbar, ToolbarItem, ToolbarSeparator } from "@/components/ui/toolbar";
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Download, Smartphone, Monitor } from "lucide-react";
import { useStudioStore } from "@/stores/useStudioStore";
import { exportImage } from "@/lib/exportImage";
import { toast } from "@/hooks/use-toast";

interface StudioToolbarProps {
  onBack?: () => void;
}

export const StudioToolbar = ({ onBack }: StudioToolbarProps) => {
  const { mode, frameSrc, photoDataUrl, zoom, offset, setZoom, setOffset } = useStudioStore();

  const handleZoomIn = () => {
    setZoom(Math.min(3, zoom + 0.1));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(1, zoom - 0.1));
  };

  const handleReset = () => {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSave = async () => {
    if (!photoDataUrl || !frameSrc) {
      toast({
        title: "Error",
        description: "No photo or frame selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportImage(photoDataUrl, frameSrc, mode, zoom, offset, {
        format: 'png',
        quality: 0.9
      });
      
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
          disabled={zoom <= 1}
          aria-label="Zoom out"
          title="Zoom out (-)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-sm text-muted-foreground min-w-[3rem] text-center px-2">
          {Math.round(zoom * 100)}%
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
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