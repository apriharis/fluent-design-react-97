import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Camera, ZoomIn, Palette } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useStudioStore } from "@/stores/useStudioStore"
import CameraView from "@/components/CameraView"
import CanvasComposer from "@/components/CanvasComposer"
import FramePicker from "@/components/FramePicker"
import { StudioStepper } from "@/components/StudioStepper"
import { StudioToolbar } from "@/components/StudioToolbar"

const Studio = () => {
  const { mode, frameSrc, photoDataUrl, leftPhotoDataUrl, rightPhotoDataUrl, reset } = useStudioStore();
  const navigate = useNavigate();

  const getCurrentStep = () => {
    if (!frameSrc) return 1;
    
    if (mode === 'portrait') {
      if (!photoDataUrl) return 2;
      return 3;
    } else {
      // Landscape mode - need both photos
      if (!rightPhotoDataUrl) return 2; // First capture for right slot
      if (!leftPhotoDataUrl) return 2; // Second capture for left slot
      return 3;
    }
  };

  const getCurrentCaptureSlot = () => {
    if (mode === 'portrait') return 'single';
    if (!rightPhotoDataUrl) return 'right';
    if (!leftPhotoDataUrl) return 'left';
    return 'complete';
  };

  const currentStep = getCurrentStep();
  const captureSlot = getCurrentCaptureSlot();

  const handleBack = () => {
    if (currentStep === 3) {
      // Go back to step 2 (camera) by clearing photos
      const { setPhotoDataUrl, setLeftPhotoDataUrl, setRightPhotoDataUrl } = useStudioStore.getState();
      setPhotoDataUrl(undefined);
      setLeftPhotoDataUrl(undefined);
      setRightPhotoDataUrl(undefined);
    } else if (currentStep === 2) {
      // Go back to step 1 (frame picker) 
      reset();
    } else {
      // Go to home
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-sticky">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">
                {currentStep === 1 ? 'Back to Home' : 'Back'}
              </span>
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">Photo Studio</span>
            </div>
          </div>
          <StudioStepper compact={currentStep === 3} />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold flex items-center justify-center gap-2">
                <Palette className="h-8 w-8" />
                Choose Your Frame
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Select a frame style to get started with your photo session
              </p>
            </div>
            <FramePicker />
          </div>
        )}

        {currentStep === 2 && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {mode === 'portrait' 
                  ? 'Take Your Photo'
                  : captureSlot === 'right' 
                    ? 'Take Photo 1 (Right Side)'
                    : 'Take Photo 2 (Left Side)'
                }
              </CardTitle>
              <CardDescription>
                {mode === 'portrait' 
                  ? 'Position yourself within the frame guidelines and capture your photo'
                  : captureSlot === 'right'
                    ? 'First, capture your photo for the right side of the frame'
                    : 'Now capture your photo for the left side of the frame'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <CameraView className="w-full" captureSlot={captureSlot} />
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <>
            {/* Canvas Area - Proper Aspect Ratio */}
            <div className="pb-24 px-4"> {/* Bottom padding for fixed toolbar, side padding for mobile */}
              <div className="mx-auto max-w-4xl">
                <CanvasComposer 
                  className={mode === 'portrait' 
                    ? "w-full aspect-[3/4] max-h-[calc(100vh-16rem)]" 
                    : "w-full aspect-[4/3] max-h-[calc(100vh-16rem)]"
                  } 
                />
              </div>
            </div>
            
            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-fixed bg-background/95 backdrop-blur-sm border-t shadow-lg">
              <div className="container mx-auto px-4 py-4">
                <StudioToolbar onBack={handleBack} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Studio