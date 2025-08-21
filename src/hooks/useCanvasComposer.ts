import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudioStore } from '@/stores/useStudioStore';
import { getFrameMeta, calculateSafeArea } from '@/lib/frameUtils';
import { calculateCoverFit, clampOffset } from '@/lib/frameDetection';
import type { SafeRect } from '@/lib/frameDetection';

interface UseCanvasComposerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

interface UseCanvasComposerReturn {
  redraw: () => void;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export const useCanvasComposer = ({ canvasRef }: UseCanvasComposerProps): UseCanvasComposerReturn => {
  const { 
    mode, 
    frameSrc, 
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
    setZoom, 
    setOffset,
    setLeftZoom,
    setLeftOffset,
    setRightZoom,
    setRightOffset
  } = useStudioStore();
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const photoImage = useRef<HTMLImageElement | null>(null);
  const leftPhotoImage = useRef<HTMLImageElement | null>(null);
  const rightPhotoImage = useRef<HTMLImageElement | null>(null);
  const frameImage = useRef<HTMLImageElement | null>(null);
  const [safeRect, setSafeRect] = useState<SafeRect | null>(null);
  const [leftSafeRect, setLeftSafeRect] = useState<SafeRect | null>(null);
  
  // Touch handling
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  // Load images
  useEffect(() => {
    if (photoDataUrl) {
      const img = new Image();
      img.onload = () => {
        photoImage.current = img;
        redraw();
      };
      img.src = photoDataUrl;
    }
  }, [photoDataUrl]);

  useEffect(() => {
    if (leftPhotoDataUrl) {
      const img = new Image();
      img.onload = () => {
        leftPhotoImage.current = img;
        redraw();
      };
      img.src = leftPhotoDataUrl;
    }
  }, [leftPhotoDataUrl]);

  useEffect(() => {
    if (rightPhotoDataUrl) {
      const img = new Image();
      img.onload = () => {
        rightPhotoImage.current = img;
        redraw();
      };
      img.src = rightPhotoDataUrl;
    }
  }, [rightPhotoDataUrl]);

  // Load frame and detect safe areas
  useEffect(() => {
    const loadFrameAndDetectSafeArea = async () => {
      if (frameSrc) {
        // Load frame image
        const img = new Image();
        img.onload = async () => {
          frameImage.current = img;
          
          // Get frame meta with auto-detected safe rect for right slot
          const frameMeta = await getFrameMeta(mode);
          if (frameMeta) {
            setSafeRect(frameMeta.safeRect);
          }
          
          // For landscape mode, also set left safe area (left half of canvas)
          if (mode === 'landscape') {
            const leftSafe = { x: 0, y: 0, width: 0.48, height: 1.0 };
            setLeftSafeRect(leftSafe);
          }
          
          redraw();
        };
        img.src = frameSrc;
      }
    };

    loadFrameAndDetectSafeArea();
  }, [frameSrc, mode]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size with DPR for sharp rendering
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (mode === 'portrait') {
      // Portrait mode - single photo
      if (safeRect && photoImage.current) {
        const safeArea = calculateSafeArea(rect.width, rect.height, safeRect);
        drawPhotoInSlot(ctx, photoImage.current, safeArea, zoom, offset);
      }
    } else {
      // Landscape mode - dual photos
      if (leftSafeRect && leftPhotoImage.current) {
        const leftSafeArea = calculateSafeArea(rect.width, rect.height, leftSafeRect);
        drawPhotoInSlot(ctx, leftPhotoImage.current, leftSafeArea, leftZoom, leftOffset);
      }
      
      if (safeRect && rightPhotoImage.current) {
        const rightSafeArea = calculateSafeArea(rect.width, rect.height, safeRect);
        drawPhotoInSlot(ctx, rightPhotoImage.current, rightSafeArea, rightZoom, rightOffset);
      }
    }

    // Draw frame overlay on top
    if (frameImage.current) {
      ctx.drawImage(frameImage.current, 0, 0, rect.width, rect.height);
    }
  }, [canvasRef, mode, safeRect, leftSafeRect, zoom, offset, leftZoom, leftOffset, rightZoom, rightOffset]);

  const drawPhotoInSlot = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    safeArea: SafeRect,
    slotZoom: number,
    slotOffset: { x: number; y: number }
  ) => {
    ctx.save();
    
    // Calculate cover-fit dimensions with 2% bleed
    const { width: photoWidth, height: photoHeight } = calculateCoverFit(
      image.width,
      image.height,
      safeArea,
      slotZoom
    );

    // Apply clamped offset to keep photo edges within safe area
    const clampedOffset = clampOffset(slotOffset, photoWidth, photoHeight, safeArea);

    // Center photo in safe area with offset
    const photoX = safeArea.x + (safeArea.width - photoWidth) / 2 + clampedOffset.x;
    const photoY = safeArea.y + (safeArea.height - photoHeight) / 2 + clampedOffset.y;

    // Clip to safe area
    ctx.beginPath();
    ctx.rect(safeArea.x, safeArea.y, safeArea.width, safeArea.height);
    ctx.clip();

    ctx.drawImage(image, photoX, photoY, photoWidth, photoHeight);
    ctx.restore();
  };

  // Get current slot's zoom and offset for interactions
  const getCurrentSlotControls = () => {
    if (mode === 'portrait') {
      return { zoom, offset, setZoom, setOffset };
    } else {
      return activeSlot === 'left' 
        ? { zoom: leftZoom, offset: leftOffset, setZoom: setLeftZoom, setOffset: setLeftOffset }
        : { zoom: rightZoom, offset: rightOffset, setZoom: setRightZoom, setOffset: setRightOffset };
    }
  };

  const getCurrentSafeRect = () => {
    if (mode === 'portrait') return safeRect;
    return activeSlot === 'left' ? leftSafeRect : safeRect;
  };

  const getCurrentImage = () => {
    if (mode === 'portrait') return photoImage.current;
    return activeSlot === 'left' ? leftPhotoImage.current : rightPhotoImage.current;
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const currentSafeRect = getCurrentSafeRect();
    const currentImage = getCurrentImage();
    const { zoom: currentZoom, offset: currentOffset, setOffset: setCurrentOffset } = getCurrentSlotControls();
    
    if (!currentSafeRect || !currentImage) return;

    const deltaX = e.clientX - lastPointer.current.x;
    const deltaY = e.clientY - lastPointer.current.y;

    const newOffset = {
      x: currentOffset.x + deltaX,
      y: currentOffset.y + deltaY,
    };

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const safeArea = calculateSafeArea(rect.width, rect.height, currentSafeRect);
      const { width: photoWidth, height: photoHeight } = calculateCoverFit(
        currentImage.width,
        currentImage.height,
        safeArea,
        currentZoom
      );
      
      const clampedOffset = clampOffset(newOffset, photoWidth, photoHeight, safeArea);
      setCurrentOffset(clampedOffset);
    } else {
      setCurrentOffset(newOffset);
    }

    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, [activeSlot, mode, canvasRef]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { zoom: currentZoom, setZoom: setCurrentZoom } = getCurrentSlotControls();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(1, Math.min(3, currentZoom + delta));
    setCurrentZoom(newZoom);
  }, [activeSlot, mode]);

  // Touch gesture handling
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length === 0) return { x: 0, y: 0 };
    let x = 0, y = 0;
    for (let i = 0; i < touches.length; i++) {
      x += touches[i].clientX;
      y += touches[i].clientY;
    }
    return { x: x / touches.length, y: y / touches.length };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const { zoom: currentZoom } = getCurrentSlotControls();
    
    if (e.touches.length === 1) {
      // Single touch - start dragging
      isDragging.current = true;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Two finger pinch - start zooming
      isDragging.current = false;
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
      setInitialZoom(currentZoom);
    }
  }, [activeSlot, mode]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    const currentSafeRect = getCurrentSafeRect();
    const currentImage = getCurrentImage();
    const { zoom: currentZoom, offset: currentOffset, setOffset: setCurrentOffset, setZoom: setCurrentZoom } = getCurrentSlotControls();
    
    if (e.touches.length === 1 && isDragging.current && currentSafeRect && currentImage) {
      // Single touch drag
      const deltaX = e.touches[0].clientX - lastPointer.current.x;
      const deltaY = e.touches[0].clientY - lastPointer.current.y;

      const newOffset = {
        x: currentOffset.x + deltaX,
        y: currentOffset.y + deltaY,
      };

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const safeArea = calculateSafeArea(rect.width, rect.height, currentSafeRect);
        const { width: photoWidth, height: photoHeight } = calculateCoverFit(
          currentImage.width,
          currentImage.height,
          safeArea,
          currentZoom
        );
        
        const clampedOffset = clampOffset(newOffset, photoWidth, photoHeight, safeArea);
        setCurrentOffset(clampedOffset);
      } else {
        setCurrentOffset(newOffset);
      }

      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouchDistance) {
      // Two finger pinch zoom
      const currentDistance = getTouchDistance(e.touches);
      if (currentDistance && lastTouchDistance) {
        const scaleChange = currentDistance / lastTouchDistance;
        const newZoom = Math.max(1, Math.min(3, initialZoom * scaleChange));
        setCurrentZoom(newZoom);
      }
    }
  }, [activeSlot, mode, lastTouchDistance, initialZoom, canvasRef]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    setLastTouchDistance(null);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentSafeRect = getCurrentSafeRect();
    const currentImage = getCurrentImage();
    const { zoom: currentZoom, offset: currentOffset, setZoom: setCurrentZoom, setOffset: setCurrentOffset } = getCurrentSlotControls();
    
    if (!currentSafeRect || !currentImage) return;
    
    const step = 10;
    const zoomStep = 0.1;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        {
          const newOffset = { x: currentOffset.x - step, y: currentOffset.y };
          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const safeArea = calculateSafeArea(rect.width, rect.height, currentSafeRect);
            const { width: photoWidth, height: photoHeight } = calculateCoverFit(
              currentImage.width,
              currentImage.height,
              safeArea,
              currentZoom
            );
            setCurrentOffset(clampOffset(newOffset, photoWidth, photoHeight, safeArea));
          } else {
            setCurrentOffset(newOffset);
          }
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        {
          const newOffset = { x: currentOffset.x + step, y: currentOffset.y };
          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const safeArea = calculateSafeArea(rect.width, rect.height, currentSafeRect);
            const { width: photoWidth, height: photoHeight } = calculateCoverFit(
              currentImage.width,
              currentImage.height,
              safeArea,
              currentZoom
            );
            setCurrentOffset(clampOffset(newOffset, photoWidth, photoHeight, safeArea));
          } else {
            setCurrentOffset(newOffset);
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        {
          const newOffset = { x: currentOffset.x, y: currentOffset.y - step };
          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const safeArea = calculateSafeArea(rect.width, rect.height, currentSafeRect);
            const { width: photoWidth, height: photoHeight } = calculateCoverFit(
              currentImage.width,
              currentImage.height,
              safeArea,
              currentZoom
            );
            setCurrentOffset(clampOffset(newOffset, photoWidth, photoHeight, safeArea));
          } else {
            setCurrentOffset(newOffset);
          }
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        {
          const newOffset = { x: currentOffset.x, y: currentOffset.y + step };
          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const safeArea = calculateSafeArea(rect.width, rect.height, currentSafeRect);
            const { width: photoWidth, height: photoHeight } = calculateCoverFit(
              currentImage.width,
              currentImage.height,
              safeArea,
              currentZoom
            );
            setCurrentOffset(clampOffset(newOffset, photoWidth, photoHeight, safeArea));
          } else {
            setCurrentOffset(newOffset);
          }
        }
        break;
      case '+':
      case '=':
        e.preventDefault();
        setCurrentZoom(Math.min(3, currentZoom + zoomStep));
        break;
      case '-':
        e.preventDefault();
        setCurrentZoom(Math.max(1, currentZoom - zoomStep));
        break;
      case '0':
        e.preventDefault();
        setCurrentOffset({ x: 0, y: 0 });
        setCurrentZoom(1);
        break;
    }
  }, [activeSlot, mode, canvasRef]);

  // Redraw when dependencies change
  useEffect(() => {
    redraw();
  }, [redraw]);

  return {
    redraw,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove, 
    handleTouchEnd,
    handleKeyDown,
  };
};
