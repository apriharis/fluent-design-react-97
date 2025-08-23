import { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, RotateCcw, FlipHorizontal, Grid3X3, Video, Upload } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useStudioStore } from '@/stores/useStudioStore';

interface CameraViewProps {
  onCapture?: (dataUrl: string) => void;
  onRetake?: () => void;
  className?: string;
  captureSlot?: 'single' | 'left' | 'right' | 'complete';
}

const CameraView = ({ onCapture, onRetake, className = '', captureSlot = 'single' }: CameraViewProps) => {
  const { 
    mode, photoDataUrl, leftPhotoDataUrl, rightPhotoDataUrl, 
    setPhotoDataUrl, setLeftPhotoDataUrl, setRightPhotoDataUrl,
    setLeftZoom, setLeftOffset, setRightZoom, setRightOffset,
    setZoom, setOffset
  } = useStudioStore();

  const [showGrid, setShowGrid] = useState(false);

  const {
    ready,
    startCountdown,
    capture,
    error,
    mirrored,
    toggleMirror,
    webcamRef,                 // ← pakai ref dari hook (JANGAN deklarasi ulang)
    isCountingDown,
    countdown,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
  } = useCamera();

  // Container untuk mapping object-fit cover
  const containerRef = useRef<HTMLDivElement>(null);
  // PATCH 1: Pakai stageRef (inner container 4:3)
  const stageRef = useRef<HTMLDivElement>(null);

  // Samakan dengan composer (normalized 0..1)
  const RIGHT_SAFE = { x: 0.575, y: 0.06, width: 0.40, height: 0.84 };
  const LEFT_HALF  = { x: 0.0,   y: 0.0,  width: 0.5,  height: 1.0  };

  // ========= Utils: mapping kotak biru → sumber video =========
  function getDisplayedVideoRect(video: HTMLVideoElement, container: HTMLElement) {
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return { x: 0, y: 0, w: cw, h: ch, scale: 1 };

    // object-fit: cover
    const scale = Math.max(cw / vw, ch / vh);
    const w = vw * scale;
    const h = vh * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    return { x, y, w, h, scale };
  }

  function safeToPx(safe: typeof RIGHT_SAFE | typeof LEFT_HALF, cw: number, ch: number) {
    return { x: safe.x * cw, y: safe.y * ch, w: safe.width * cw, h: safe.height * ch };
  }

  // PATCH 2: Crop aware terhadap mirror
function containerPxToVideoPx(
  pxRect: {x:number;y:number;w:number;h:number},
  displayed: {x:number;y:number;w:number;h:number;scale:number},
  mirrored: boolean,
  sourceW: number
) {
  const u  = (pxRect.x - displayed.x) / displayed.scale;
  const v  = (pxRect.y - displayed.y) / displayed.scale;
  const sw =  pxRect.w               / displayed.scale;
  const sh =  pxRect.h               / displayed.scale;

  const sx = mirrored ? (sourceW - (u + sw)) : u; // ← ini kuncinya
  const sy = v;

  return { sx, sy, sw, sh };
}



  // ========= Upload (fallback) =========
  const handleUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (captureSlot === 'left') {
          setLeftPhotoDataUrl(dataUrl);
        } else if (captureSlot === 'right') {
          setRightPhotoDataUrl(dataUrl);
        } else {
          setPhotoDataUrl(dataUrl);
        }
        onCapture?.(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // ========= Capture =========
const handleCapture = async () => {
  await startCountdown();

  const video = webcamRef.current?.video as HTMLVideoElement | undefined;
  const stage = stageRef.current as HTMLDivElement | undefined;
  if (!video) return;

  // SLOT KANAN: crop tepat RIGHT_SAFE
  if (captureSlot === 'right') {
    if (!stage) return;

    const disp = getDisplayedVideoRect(video, stage);
    const srPx = safeToPx(RIGHT_SAFE, stage.clientWidth, stage.clientHeight);
    let { sx, sy, sw, sh } = containerPxToVideoPx(srPx, disp, mirrored, video.videoWidth);

    // clamp ke ukuran sumber
    const maxW = video.videoWidth, maxH = video.videoHeight;
    sx = Math.max(0, Math.min(sx, maxW));
    sy = Math.max(0, Math.min(sy, maxH));
    sw = Math.max(1, Math.min(sw, maxW - sx));
    sh = Math.max(1, Math.min(sh, maxH - sy));

    // canvas output = ukuran crop
    const out = document.createElement('canvas');
    out.width  = Math.round(sw);
    out.height = Math.round(sh);
    const octx = out.getContext('2d')!;

    // 🔁 JAGA ORIENTASI: kalau mirrored → flip horizontal
    if (mirrored) {
      octx.translate(out.width, 0);
      octx.scale(-1, 1);
    }

    octx.drawImage(video, sx, sy, sw, sh, 0, 0, out.width, out.height);

    const dataUrl = out.toDataURL('image/jpeg', 0.92);
    setRightPhotoDataUrl(dataUrl);
    setRightZoom(1);
    setRightOffset({ x: 0, y: 0 });
    onCapture?.(dataUrl);
    return;
  }

  // SLOT KIRI / SINGLE: ambil full frame dari video (bukan capture()),
  // supaya bisa di-mirror juga jika diperlukan → WYSIWYG
  const out = document.createElement('canvas');
  out.width  = video.videoWidth;
  out.height = video.videoHeight;
  const octx = out.getContext('2d')!;

  if (mirrored) {
    octx.translate(out.width, 0);
    octx.scale(-1, 1);
  }

  octx.drawImage(video, 0, 0, out.width, out.height);

  const dataUrl = out.toDataURL('image/jpeg', 0.92);

  if (captureSlot === 'left') {
    setLeftPhotoDataUrl(dataUrl);
    setLeftZoom(1);
    setLeftOffset({ x: 0, y: 0 });
  } else {
    setPhotoDataUrl(dataUrl);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }
  onCapture?.(dataUrl);
};


  const handleRetake = () => {
    if (captureSlot === 'left') {
      setLeftPhotoDataUrl(undefined);
    } else if (captureSlot === 'right') {
      setRightPhotoDataUrl(undefined);
    } else {
      setPhotoDataUrl(undefined);
    }
    onRetake?.();
  };

  const getCurrentPhoto = () => {
    if (captureSlot === 'left') return leftPhotoDataUrl;
    if (captureSlot === 'right') return rightPhotoDataUrl;
    return photoDataUrl;
  };
  const currentPhoto = getCurrentPhoto();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!currentPhoto && ready && !isCountingDown) handleCapture();
      else if (currentPhoto) handleRetake();
    }
    if (e.key === 'g' || e.key === 'G') setShowGrid((v) => !v);
  };

  // Overlay safe rect untuk capture:
  const getOverlayRect = () => {
    if (mode === 'portrait') {
      return { x: 0.09, y: 0.08, width: 0.82, height: 0.78 };
    }
    if (captureSlot === 'left') {
      return LEFT_HALF; // overlay kiri = setengah kiri
    }
    // right:
    return RIGHT_SAFE;  // overlay kanan persis RIGHT_SAFE
  };
  const r = getOverlayRect();

  return (
    <div className={`relative w-full h-full bg-background ${className}`}>
      <div
        ref={stageRef}
        className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden"
      >
        {!currentPhoto ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              muted
              playsInline
              screenshotFormat="image/jpeg"
              videoConstraints={{
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }}
              className="w-full h-full object-cover"
              mirrored={mirrored}
            />

            {/* PATCH 4: Overlay kotak biru tetap % di stageRef */}
            {ready && r && (
              <div
                className="absolute border-2 border-primary border-dashed opacity-50 pointer-events-none"
                style={{
                  left:   `${r.x * 100}%`,
                  top:    `${r.y * 100}%`,
                  width:  `${r.width * 100}%`,
                  height: `${r.height * 100}%`,
                  boxSizing: 'border-box',
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
            src={currentPhoto}
            alt={`Captured photo preview${captureSlot !== 'single' ? ` (${captureSlot} side)` : ''}`}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Device Selector */}
      {devices.length > 1 && !currentPhoto && (
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

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-6">
        {!currentPhoto ? (
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
              <Button variant="outline" size="lg" className="px-4 sm:px-6" title="Upload photo instead">
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
        {!ready && !error && <p className="text-muted-foreground">Initializing camera...</p>}
        {ready && !currentPhoto && (
          <div className="space-y-1">
            <p className="text-muted-foreground">
              {captureSlot === 'left' 
                ? 'Position yourself for the left side photo'
                : captureSlot === 'right'
                ? 'Position yourself within the dashed area'
                : 'Position yourself within the dashed area'}
            </p>
            <p className="text-xs text-muted-foreground">
              Press G to toggle grid • Enter/Space to capture
            </p>
          </div>
        )}
        {currentPhoto && (
          <p className="text-success">
            {captureSlot === 'left' 
              ? 'Left side photo captured!' 
              : captureSlot === 'right'
              ? 'Right side photo captured!'
              : 'Photo captured successfully!'}
          </p>
        )}
      </div>
    </div>
  );
};

export default CameraView;
