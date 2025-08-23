import { useRef, useState } from "react";
import { useStudioStore } from "@/stores/useStudioStore";
import { cn } from "@/lib/utils";
import { useCanvasComposer } from "@/hooks/useCanvasComposer";
import { SlotSwitcher } from "./SlotSwitcher";
import { IconButton } from "@/components/ui/icon-button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Undo2 } from "lucide-react";

type CanvasComposerProps = { className?: string };

export default function CanvasComposer({ className = "" }: CanvasComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showMasks, setShowMasks] = useState(false);
  const {
    mode,
    photoDataUrl,
    leftPhotoDataUrl,
    rightPhotoDataUrl,
    activeSlot,
    zoom,
    offset,
    leftZoom,
    leftOffset,
    rightZoom,
    rightOffset,
    setPhotoDataUrl,
    setLeftPhotoDataUrl,
    setRightPhotoDataUrl,
    setZoom,
    setOffset,
    setLeftZoom,
    setLeftOffset,
    setRightZoom,
    setRightOffset,
  } = useStudioStore();

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
  } = useCanvasComposer({ canvasRef, showMasks });

  // Aspect ratio class
  const aspectClass = mode === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]";
  // Max width/height by viewport
  const maxByViewport =
    mode === "portrait"
      ? "max-w-[min(100%,calc((100vh-16rem)*3/4))] max-h-[calc(100vh-16rem)]"
      : "max-w-[min(100%,calc((100vh-16rem)*4/3))] max-h-[calc(100vh-16rem)]";

  // Check if we have photos to display
  const hasPhotos =
    mode === "portrait"
      ? !!photoDataUrl
      : !!(leftPhotoDataUrl && rightPhotoDataUrl);

  if (!hasPhotos) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg",
          aspectClass,
          maxByViewport,
          className
        )}
      >
        <p className="text-muted-foreground">
          {mode === "portrait"
            ? "No photo to edit"
            : "Capture both photos to start editing"}
        </p>
      </div>
    );
  }

  // Get current zoom for display
  const getCurrentZoom = () => {
    if (mode === "portrait") return zoom;
    return activeSlot === "left" ? leftZoom : rightZoom;
  };

  // Undo stack for deletions (per-slot snapshots)
  type Snapshot =
    | {
        mode: "portrait";
        slot: "single";
        dataUrl: string;
        zoom: number;
        offset: { x: number; y: number };
      }
    | {
        mode: "landscape";
        slot: "left" | "right";
        dataUrl: string;
        zoom: number;
        offset: { x: number; y: number };
      };

  const undoStack = useRef<Snapshot[]>([]);

  const hasCurrentPhoto =
    mode === "portrait"
      ? !!photoDataUrl
      : activeSlot === "left"
      ? !!leftPhotoDataUrl
      : !!rightPhotoDataUrl;

  const canDelete = hasCurrentPhoto;
  const canUndo = undoStack.current.length > 0;

  const handleDeleteCurrent = () => {
    if (mode === "portrait") {
      if (!photoDataUrl) return;
      undoStack.current.push({
        mode: "portrait",
        slot: "single",
        dataUrl: photoDataUrl,
        zoom,
        offset,
      });
      setPhotoDataUrl(undefined);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } else {
      if (activeSlot === "left") {
        if (!leftPhotoDataUrl) return;
        undoStack.current.push({
          mode: "landscape",
          slot: "left",
          dataUrl: leftPhotoDataUrl,
          zoom: leftZoom,
          offset: leftOffset,
        });
        setLeftPhotoDataUrl(undefined);
        setLeftZoom(1);
        setLeftOffset({ x: 0, y: 0 });
      } else {
        if (!rightPhotoDataUrl) return;
        undoStack.current.push({
          mode: "landscape",
          slot: "right",
          dataUrl: rightPhotoDataUrl,
          zoom: rightZoom,
          offset: rightOffset,
        });
        setRightPhotoDataUrl(undefined);
        setRightZoom(1);
        setRightOffset({ x: 0, y: 0 });
      }
    }
  };

  const handleUndo = () => {
    const snap = undoStack.current.pop();
    if (!snap) return;
    if (snap.mode === "portrait") {
      setPhotoDataUrl(snap.dataUrl);
      setZoom(snap.zoom);
      setOffset(snap.offset);
    } else {
      if (snap.slot === "left") {
        setLeftPhotoDataUrl(snap.dataUrl);
        setLeftZoom(snap.zoom);
        setLeftOffset(snap.offset);
      } else {
        setRightPhotoDataUrl(snap.dataUrl);
        setRightZoom(snap.zoom);
        setRightOffset(snap.offset);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Slot Switcher for Landscape */}
      <SlotSwitcher />

      {/* Canvas Container with forced aspect ratio */}
      <div
        className={cn(
          "relative mx-auto w-full",
          aspectClass,
          maxByViewport,
          "rounded-2xl overflow-hidden bg-black/5",
          className
        )}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
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
          <div className="hidden sm:block">
            Drag to move • Pinch/Scroll to zoom • 0 to reset
          </div>
          <div className="sm:hidden">Drag • Pinch zoom</div>
        </div>

        {/* Zoom Indicator */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span>{Math.round(getCurrentZoom() * 100)}%</span>
            {mode === "landscape" && (
              <span className="text-muted-foreground">({activeSlot})</span>
            )}
          </div>
        </div>

        {/* Delete/Undo Controls */}
        <div className="absolute top-12 right-2 sm:top-16 sm:right-4 flex items-center gap-2">
          <IconButton
            aria-label="Delete current photo"
            variant="destructive"
            size="sm"
            onClick={handleDeleteCurrent}
            disabled={!canDelete}
            title="Delete current photo"
          >
            <Trash2 />
          </IconButton>
          <IconButton
            aria-label="Undo last delete"
            variant="secondary"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo last delete"
          >
            <Undo2 />
          </IconButton>
        </div>

        {/* Debug Toggle */}
        <div className="absolute bottom-12 right-2 sm:bottom-16 sm:right-4 flex items-center gap-2 bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm">
          <span>Show Slot Masks</span>
          <Switch checked={showMasks} onCheckedChange={setShowMasks} />
        </div>

        {/* Keyboard Instructions (Desktop only) */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/80 text-white text-xs px-3 py-2 rounded-md backdrop-blur-sm hidden lg:block">
          ←→↑↓: Move • +/-: Zoom • 0: Reset
        </div>
      </div>
    </div>
  );
}