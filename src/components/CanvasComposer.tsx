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
      <div className={`flex items-center justify-center bg-muted rounded-lg ${
        className?.includes('h-[') ? className : 'h-96'
      }`}>
        <p className="text-muted-foreground">No photo to edit</p>
      </div>
    );
  }

  return (
    <div className="relative bg-muted rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`w-full cursor-move touch-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          className?.includes('h-[') ? className : 'h-64 sm:h-80 md:h-96'
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
      
      {/* Touch Instructions Overlay */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm">
        <div className="hidden sm:block">Drag: Move • Scroll: Zoom • 0: Reset</div>
        <div className="sm:hidden">Drag • Pinch zoom</div>
      </div>

      {/* Keyboard Instructions */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm hidden lg:block">
        ←→↑↓: Move • +/-: Zoom • 0: Reset
      </div>
    </div>
  );
};

export default CanvasComposer;