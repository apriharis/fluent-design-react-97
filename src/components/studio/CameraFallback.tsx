import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, AlertCircle } from "lucide-react";
import { useStudioStore } from "@/stores/useStudioStore";

interface CameraFallbackProps {
  captureSlot?: 'single' | 'left' | 'right' | 'complete';
  onSuccess?: (dataUrl: string) => void;
}

export const CameraFallback = ({ captureSlot = 'single', onSuccess }: CameraFallbackProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { setPhotoDataUrl, setLeftPhotoDataUrl, setRightPhotoDataUrl } = useStudioStore();

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // Store photo based on capture slot
      if (captureSlot === 'left') {
        setLeftPhotoDataUrl(dataUrl);
      } else if (captureSlot === 'right') {
        setRightPhotoDataUrl(dataUrl);
      } else {
        setPhotoDataUrl(dataUrl);
      }
      
      onSuccess?.(dataUrl);
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <Card className="border-dashed border-2 border-destructive/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 bg-destructive/10 rounded-xl flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-destructive">Camera not available</CardTitle>
        <CardDescription>
          Camera access is not available. You can still upload a photo from your device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Click below to upload a photo
            </p>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Upload photo"
          />
          <Button 
            variant="gradient" 
            size="lg" 
            className="w-full" 
            disabled={isUploading}
          >
            <Upload className="mr-2 h-5 w-5" />
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Supported formats: JPG, PNG, WebP
        </p>
      </CardContent>
    </Card>
  );
};