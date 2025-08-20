import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/stores/useStudioStore";

export const SlotSwitcher = () => {
  const { mode, activeSlot, setActiveSlot, leftPhotoDataUrl, rightPhotoDataUrl } = useStudioStore();
  
  if (mode !== 'landscape') return null;
  
  return (
    <div className="flex items-center justify-center gap-1 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setActiveSlot('left')}
        className={cn(
          "px-4 py-2 text-xs font-medium transition-all",
          activeSlot === 'left' 
            ? "bg-primary text-primary-foreground border-primary" 
            : "hover:bg-muted"
        )}
        disabled={!leftPhotoDataUrl}
      >
        Left
        {leftPhotoDataUrl && (
          <div className="ml-2 w-2 h-2 rounded-full bg-success" />
        )}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setActiveSlot('right')}
        className={cn(
          "px-4 py-2 text-xs font-medium transition-all",
          activeSlot === 'right' 
            ? "bg-primary text-primary-foreground border-primary" 
            : "hover:bg-muted"
        )}
        disabled={!rightPhotoDataUrl}
      >
        Right
        {rightPhotoDataUrl && (
          <div className="ml-2 w-2 h-2 rounded-full bg-success" />
        )}
      </Button>
    </div>
  );
};