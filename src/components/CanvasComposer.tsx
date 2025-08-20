import { useRef, useEffect } from 'react';
import { useCanvasComposer } from '@/hooks/useCanvasComposer';
import { useStudioStore } from '@/stores/useStudioStore';

interface CanvasComposerProps {
  className?: string;
}

const CanvasComposer = ({ className = '' }: CanvasComposerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { photoDataUrl } = useStudioStore();
  
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

  if (!photoDataUrl) {
    return (
      <div className={`flex items-center justify-center h-96 bg-muted rounded-lg ${className}`}>
        <p className="text-muted-foreground">No photo to edit</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Canvas */}
      <div className="relative bg-muted rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-64 sm:h-80 md:h-96 cursor-move touch-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
        
        {/* Touch Instructions Overlay */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/70 text-white text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md">
          <div className="hidden sm:block">Drag to move • Scroll/Pinch to zoom</div>
          <div className="sm:hidden">Drag • Pinch zoom</div>
        </div>

        {/* Keyboard Instructions */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md hidden lg:block">
          Arrow keys: Move • +/-: Zoom • 0: Reset
        </div>
      </div>
    </div>
  );
};

export default CanvasComposer;