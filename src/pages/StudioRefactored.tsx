import { Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, Palette } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useStudioStore } from "@/stores/useStudioStore";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorBoundary } from "@/components/studio/ErrorBoundary";
import { MobileStepper } from "@/components/studio/MobileStepper";
import { BottomSheet } from "@/components/studio/BottomSheet";
import { StudioStepper } from "@/components/StudioStepper";
import { CameraFallback } from "@/components/studio/CameraFallback";

// Lazy load heavy components
const CameraView = lazy(() => import("@/components/CameraView"));
const CanvasComposer = lazy(() => import("@/components/CanvasComposer"));
const FramePicker = lazy(() => import("@/components/FramePicker"));
const StudioToolbar = lazy(() => import("@/components/StudioToolbar"));

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
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-subtle">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-sticky">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold text-sm sm:text-base">
                  {currentStep === 1 ? 'Home' : 'Back'}
                </span>
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold">Photo Studio</span>
              </div>
            </div>
            
            {/* Mobile Stepper - Horizontal scroll */}
            <div className="sm:hidden">
              <MobileStepper />
            </div>
            
            {/* Desktop Stepper */}
            <div className="hidden sm:block">
              <StudioStepper compact={currentStep === 3} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {currentStep === 1 && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center justify-center gap-2">
                  <Palette className="h-6 w-6 sm:h-8 sm:w-8" />
                  Choose Your Frame
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Select a frame style to get started with your photo session
                </p>
              </div>
              <Suspense fallback={<LoadingSkeleton variant="frame-picker" />}>
                <FramePicker />
              </Suspense>
            </div>
          )}

          {currentStep === 2 && (
            <Card variant="elevated" className="max-w-4xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl">
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
                  {mode === 'portrait' 
                    ? 'Take Your Photo'
                    : captureSlot === 'right' 
                      ? 'Photo 1 (Right Side)'
                      : 'Photo 2 (Left Side)'
                  }
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {mode === 'portrait' 
                    ? 'Position yourself within the frame guidelines and capture your photo'
                    : captureSlot === 'right'
                      ? 'First, capture your photo for the right side of the frame'
                      : 'Now capture your photo for the left side of the frame'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <Suspense fallback={<LoadingSkeleton variant="camera-view" />}>
                  <ErrorBoundary fallback={<CameraFallback captureSlot={captureSlot} />}>
                    <CameraView className="w-full" captureSlot={captureSlot} />
                  </ErrorBoundary>
                </Suspense>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <>
              {/* Canvas Area - Responsive */}
              <div className="pb-20 sm:pb-24 px-2 sm:px-4">
                <div className="mx-auto max-w-4xl">
                  <Suspense fallback={<LoadingSkeleton variant="canvas-composer" />}>
                    <CanvasComposer 
                      className={mode === 'portrait' 
                        ? "w-full aspect-[3/4] max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-16rem)]" 
                        : "w-full aspect-[4/3] max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-16rem)]"
                      } 
                    />
                  </Suspense>
                </div>
              </div>
              
              {/* Mobile Bottom Sheet / Desktop Fixed Bar */}
              <BottomSheet className="sm:bg-background/95 sm:backdrop-blur-sm sm:border-t sm:shadow-lg">
                <Suspense fallback={<div className="h-12 bg-muted animate-pulse rounded" />}>
                  <StudioToolbar onBack={handleBack} />
                </Suspense>
              </BottomSheet>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Studio;