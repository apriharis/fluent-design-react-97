import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Share2, ChevronDown } from "lucide-react";
import { useStudioStore } from "@/stores/useStudioStore";
import { exportImage } from "@/lib/exportImage";
import { toast } from "@/hooks/use-toast";

export const ExportControls = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { 
    mode, 
    frameSrc, 
    photoDataUrl, 
    leftPhotoDataUrl, 
    rightPhotoDataUrl,
    zoom, 
    offset, 
    leftZoom, 
    leftOffset, 
    rightZoom, 
    rightOffset
  } = useStudioStore();

  const hasPhotos = mode === 'portrait' ? !!photoDataUrl : !!(leftPhotoDataUrl && rightPhotoDataUrl);
  
  const handleExport = async (format: 'png' | 'jpeg', quality = 0.9) => {
    if (!hasPhotos || !frameSrc) {
      toast({
        title: "Export failed",
        description: mode === 'portrait' ? "Photo and frame are required" : "Both photos and frame are required",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      if (mode === 'portrait') {
        await exportImage(photoDataUrl!, frameSrc, mode, zoom, offset, {
          format,
          quality
        });
      } else {
        await exportImage(rightPhotoDataUrl!, frameSrc, mode, rightZoom, rightOffset, {
          format,
          quality,
          leftPhoto: leftPhotoDataUrl!,
          leftZoom,
          leftOffset
        });
      }
      
      toast({
        title: "Export successful",
        description: `Your photo has been downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      toast({
        title: "Share not supported",
        description: "Web share is not supported on this device",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.share({
        title: 'My Studio Photo',
        text: 'Check out this photo I created in Studio!',
        url: window.location.href
      });
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: "Share failed",
          description: "Unable to share at this time",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Download */}
      <Button 
        variant="gradient" 
        size="sm" 
        onClick={() => handleExport('png')}
        disabled={!hasPhotos || !frameSrc || isExporting}
        className="shrink-0"
      >
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">
          {isExporting ? 'Exporting...' : 'Save'}
        </span>
      </Button>

      {/* Advanced Export Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPhotos || !frameSrc || isExporting}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('png', 1.0)}>
            Export as PNG (High Quality)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('jpeg', 0.95)}>
            Export as JPEG (High Quality)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('jpeg', 0.8)}>
            Export as JPEG (Compressed)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Button */}
      {navigator.share && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={!hasPhotos || !frameSrc}
          title="Share photo"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};