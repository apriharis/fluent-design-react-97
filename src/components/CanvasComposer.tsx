import { useRef, useEffect } from 'react';
import { useCanvasComposer } from '@/hooks/useCanvasComposer';
import { useStudioStore } from '@/stores/useStudioStore';
import { SlotSwitcher } from './SlotSwitcher';

interface CanvasComposerProps {
  className?: string;
}

const CanvasComposer = ({ className = '' }: CanvasComposerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mode, photoDataUrl, leftPhotoDataUrl, rightPhotoDataUrl, activeSlot, zoom, leftZoom, rightZoom } = useStudioStore();
  
  const {
    redraw,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  } = useCanvasComposer({ canvasRef });

  // Resize canvas on window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        redraw();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redraw]);

  // Check if we have photos to display
  const hasPhotos = mode === 'portrait' 
    ? !!photoDataUrl 
    : !!(leftPhotoDataUrl && rightPhotoDataUrl);

  if (!hasPhotos) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${
        className?.includes('aspect-') || className?.includes('h-[') 
          ? className 
          : 'h-96'
      }`}>
        <p className="text-muted-foreground">
          {mode === 'portrait' 
            ? 'No photo to edit' 
            : 'Capture both photos to start editing'
          }
        </p>
      </div>
    );
  }

  // Get current zoom for display
  const getCurrentZoom = () => {
    if (mode === 'portrait') return zoom;
    return activeSlot === 'left' ? leftZoom : rightZoom;
  };

  return (
    <div className="space-y-4">
      {/* Slot Switcher for Landscape */}
      <SlotSwitcher />
      
      {/* Canvas Container */}
      <div className="relative bg-muted rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`cursor-move touch-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            className?.includes('aspect-') || className?.includes('h-[') 
              ? className 
              : 'w-full h-64 sm:h-80 md:h-96'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="img"
          aria-label="Photo composition canvas. Use arrow keys to move, +/- to zoom, 0 to reset"
        />
        
        {/* Help Text Overlay */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm">
          <div className="hidden sm:block">Drag to move • Pinch/Scroll to zoom • 0 to reset</div>
          <div className="sm:hidden">Drag • Pinch zoom</div>
        </div>

        {/* Zoom Indicator */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span>{Math.round(getCurrentZoom() * 100)}%</span>
            {mode === 'landscape' && (
              <span className="text-muted-foreground">({activeSlot})</span>
            )}
          </div>
        </div>

        {/* Keyboard Instructions (Desktop only) */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm hidden lg:block">
          ←→↑↓: Move • +/-: Zoom • 0: Reset
        </div>
      </div>
    </div>
  );
};

export default CanvasComposer;