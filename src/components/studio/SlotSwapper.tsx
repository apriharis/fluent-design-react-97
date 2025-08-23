import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { useStudioStore } from "@/stores/useStudioStore";
import { toast } from "@/hooks/use-toast";

export const SlotSwapper = () => {
  const { 
    mode, 
    leftPhotoDataUrl, 
    rightPhotoDataUrl,
    leftZoom,
    leftOffset,
    rightZoom,
    rightOffset,
    setLeftPhotoDataUrl,
    setRightPhotoDataUrl,
    setLeftZoom,
    setLeftOffset,
    setRightZoom,
    setRightOffset
  } = useStudioStore();
  
  if (mode !== 'landscape' || !leftPhotoDataUrl || !rightPhotoDataUrl) {
    return null;
  }
  
  const handleSwap = () => {
    // Swap photos
    const tempPhoto = leftPhotoDataUrl;
    setLeftPhotoDataUrl(rightPhotoDataUrl);
    setRightPhotoDataUrl(tempPhoto);
    
    // Swap transformations
    const tempZoom = leftZoom;
    const tempOffset = leftOffset;
    setLeftZoom(rightZoom);
    setLeftOffset(rightOffset);
    setRightZoom(tempZoom);
    setRightOffset(tempOffset);
    
    toast({
      title: "Photos swapped",
      description: "Left and right photos have been swapped successfully",
    });
  };
  
  return (
    <div className="flex justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSwap}
        className="gap-2"
        title="Swap left and right photos"
      >
        <ArrowLeftRight className="h-4 w-4" />
        <span className="hidden sm:inline">Swap Photos</span>
      </Button>
    </div>
  );
};