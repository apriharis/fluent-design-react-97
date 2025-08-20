import { useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, RotateCcw, FlipHorizontal, Grid3X3, Video, Upload } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useStudioStore } from '@/stores/useStudioStore';
import { calculateSafeArea } from '@/lib/frameUtils';

interface CameraViewProps {
  onCapture?: (dataUrl: string) => void;
  onRetake?: () => void;
  className?: string;
}

const CameraView = ({ onCapture, onRetake, className = '' }: CameraViewProps) => {
  const { mode, photoDataUrl, setPhotoDataUrl } = useStudioStore();
  const [showGrid, setShowGrid] = useState(false);
  const {
    ready,
    startCountdown,
    capture,
    error,
    mirrored,
    toggleMirror,
    webcamRef,
    isCountingDown,
    countdown,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    handleUserMedia,
    handleUserMediaError,
  } = useCamera();

  const handleUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPhotoDataUrl(dataUrl);
        onCapture?.(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = async () => {
    await startCountdown();
    const dataUrl = capture();
    if (dataUrl) {
      setPhotoDataUrl(dataUrl);
      onCapture?.(dataUrl);
    }
  };

  const handleRetake = () => {
    setPhotoDataUrl(undefined);
    onRetake?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!photoDataUrl && ready && !isCountingDown) {
        handleCapture();
      } else if (photoDataUrl) {
        handleRetake();
      }
    }
    if (e.key === 'g' || e.key === 'G') {
      setShowGrid(!showGrid);
    }
  };

  // Calculate safe area overlay (using fallback normalized coords)
  const fallbackSafeRects = {
    portrait: { x: 0.09, y: 0.08, width: 0.82, height: 0.78 },
    landscape: { x: 0.62, y: 0.12, width: 0.26, height: 0.68 },
  };
  const normalizedSafeRect = fallbackSafeRects[mode];
  const safeArea = {
    x: 400 * normalizedSafeRect.x,
    y: 300 * normalizedSafeRect.y,
    width: 400 * normalizedSafeRect.width,
    height: 300 * normalizedSafeRect.height,
  };

  return (
    <div 
      className={`relative w-full h-full bg-background ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Camera view for photo capture"
    >
      {/* Camera Feed */}
      <div className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden">
        {!photoDataUrl ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              muted={true}
              playsInline={true}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                facingMode: selectedDeviceId ? undefined : 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }}
              mirrored={mirrored}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="w-full h-full object-cover"
              style={{ objectFit: 'cover' }}
              aria-label="Live camera feed"
            />
            
            {/* Safe Area Overlay */}
            {ready && safeArea && (
              <div
                className="absolute border-2 border-primary border-dashed opacity-50 pointer-events-none"
                style={{
                  left: `${(safeArea.x / 400) * 100}%`,
                  top: `${(safeArea.y / 300) * 100}%`,
                  width: `${(safeArea.width / 400) * 100}%`,
                  height: `${(safeArea.height / 300) * 100}%`,
                }}
                aria-hidden="true"
              />
            )}

            {/* Grid Overlay */}
            {showGrid && ready && (
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                {/* Vertical lines */}
                <div className="absolute left-1/3 top-0 w-px h-full bg-white/30" />
                <div className="absolute left-2/3 top-0 w-px h-full bg-white/30" />
                {/* Horizontal lines */}
                <div className="absolute top-1/3 left-0 h-px w-full bg-white/30" />
                <div className="absolute top-2/3 left-0 h-px w-full bg-white/30" />
              </div>
            )}

            {/* Countdown Overlay */}
            {isCountingDown && countdown > 0 && (
              <div 
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
                role="alert"
                aria-live="assertive"
              >
                <div className="text-6xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div 
                className="absolute inset-0 bg-destructive/10 flex items-center justify-center"
                role="alert"
                aria-live="polite"
              >
                <div className="text-destructive text-center p-4">
                  <p className="font-semibold mb-2">Camera Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <img
            src={photoDataUrl}
            alt="Captured photo preview"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Device Selector */}
      {devices.length > 1 && !photoDataUrl && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Video className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Camera Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-6">
        {!photoDataUrl ? (
          <>
            <IconButton
              variant="outline"
              size="lg"
              onClick={toggleMirror}
              disabled={!ready || isCountingDown}
              aria-label="Toggle camera mirror mode"
              title="Toggle mirror mode"
            >
              <FlipHorizontal className="h-5 w-5" />
            </IconButton>

            <IconButton
              variant="outline"
              size="lg"
              onClick={() => setShowGrid(!showGrid)}
              disabled={!ready || isCountingDown}
              aria-label={showGrid ? "Hide grid lines" : "Show grid lines"}
              title={showGrid ? "Hide grid" : "Show grid (G)"}
              className={showGrid ? "bg-primary/10 border-primary" : ""}
            >
              <Grid3X3 className="h-5 w-5" />
            </IconButton>

            <Button
              variant="gradient"
              size="lg"
              onClick={handleCapture}
              disabled={!ready || isCountingDown}
              className="px-6 sm:px-8"
              aria-label={isCountingDown ? "Taking photo, please wait" : "Capture photo"}
            >
              <Camera className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">
                {isCountingDown ? 'Taking Photo...' : 'Capture'}
              </span>
              <span className="sm:hidden">
                {isCountingDown ? 'Wait...' : 'Capture'}
              </span>
            </Button>

            {/* Upload Fallback */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadFile}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload photo instead"
              />
              <Button
                variant="outline"
                size="lg"
                className="px-4 sm:px-6"
                title="Upload photo instead"
              >
                <Upload className="mr-2 h-5 w-5" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="outline"
            size="lg"
            onClick={handleRetake}
            className="px-6 sm:px-8"
            aria-label="Retake photo"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            <span className="hidden sm:inline">Retake Photo</span>
            <span className="sm:hidden">Retake</span>
          </Button>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center mt-4" role="status" aria-live="polite">
        {!ready && !error && (
          <p className="text-muted-foreground">Initializing camera...</p>
        )}
        {ready && !photoDataUrl && (
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Position yourself within the dashed area
            </p>
            <p className="text-xs text-muted-foreground">
              Press G to toggle grid • Enter/Space to capture
            </p>
          </div>
        )}
        {photoDataUrl && (
          <p className="text-success">Photo captured successfully!</p>
        )}
      </div>
    </div>
  );
};

export default CameraView;