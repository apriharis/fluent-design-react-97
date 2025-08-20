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
  const { mode, frameSrc, photoDataUrl, zoom, offset, setZoom, setOffset } = useStudioStore();
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const photoImage = useRef<HTMLImageElement | null>(null);
  const frameImage = useRef<HTMLImageElement | null>(null);
  const [safeRect, setSafeRect] = useState<SafeRect | null>(null);
  
  // Touch handling
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  // Load images and detect safe area
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
    const loadFrameAndDetectSafeArea = async () => {
      if (frameSrc) {
        // Load frame image
        const img = new Image();
        img.onload = async () => {
          frameImage.current = img;
          
          // Get frame meta with auto-detected safe rect
          const frameMeta = await getFrameMeta(mode);
          if (frameMeta) {
            setSafeRect(frameMeta.safeRect);
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
    if (!canvas || !safeRect) return;

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

    const safeArea = calculateSafeArea(rect.width, rect.height, safeRect);

    // Draw photo first (below frame)
    if (photoImage.current) {
      ctx.save();
      
      // Calculate cover-fit dimensions with 2% bleed
      const { width: photoWidth, height: photoHeight } = calculateCoverFit(
        photoImage.current.width,
        photoImage.current.height,
        safeArea,
        zoom
      );

      // Apply clamped offset to keep photo edges within safe area
      const clampedOffset = clampOffset(offset, photoWidth, photoHeight, safeArea);

      // Center photo in safe area with offset
      const photoX = safeArea.x + (safeArea.width - photoWidth) / 2 + clampedOffset.x;
      const photoY = safeArea.y + (safeArea.height - photoHeight) / 2 + clampedOffset.y;

      // Clip to safe area
      ctx.beginPath();
      ctx.rect(safeArea.x, safeArea.y, safeArea.width, safeArea.height);
      ctx.clip();

      ctx.drawImage(photoImage.current, photoX, photoY, photoWidth, photoHeight);
      ctx.restore();
    }

    // Draw frame overlay on top
    if (frameImage.current) {
      ctx.drawImage(frameImage.current, 0, 0, rect.width, rect.height);
    }
  }, [canvasRef, safeRect, zoom, offset]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !safeRect) return;

    const deltaX = e.clientX - lastPointer.current.x;
    const deltaY = e.clientY - lastPointer.current.y;

    const newOffset = {
      x: offset.x + deltaX,
      y: offset.y + deltaY,
    };

    // Apply clamping if photo is available
    if (photoImage.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const safeArea = calculateSafeArea(rect.width, rect.height, safeRect);
      const { width: photoWidth, height: photoHeight } = calculateCoverFit(
        photoImage.current.width,
        photoImage.current.height,
        safeArea,
        zoom
      );
      
      const clampedOffset = clampOffset(newOffset, photoWidth, photoHeight, safeArea);
      setOffset(clampedOffset);
    } else {
      setOffset(newOffset);
    }

    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, [offset, setOffset, safeRect, zoom, canvasRef]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(1, Math.min(3, zoom + delta));
    setZoom(newZoom);
  }, [zoom, setZoom]);

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
    if (e.touches.length === 1) {
      // Single touch - start dragging
      isDragging.current = true;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Two finger pinch - start zooming
      isDragging.current = false;
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
      setInitialZoom(zoom);
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging.current && safeRect) {
      // Single touch drag
      const deltaX = e.touches[0].clientX - lastPointer.current.x;
      const deltaY = e.touches[0].clientY - lastPointer.current.y;

      const newOffset = {
        x: offset.x + deltaX,
        y: offset.y + deltaY,
      };

      // Apply clamping if photo is available
      if (photoImage.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const safeArea = calculateSafeArea(rect.width, rect.height, safeRect);
        const { width: photoWidth, height: photoHeight } = calculateCoverFit(
          photoImage.current.width,
          photoImage.current.height,
          safeArea,
          zoom
        );
        
        const clampedOffset = clampOffset(newOffset, photoWidth, photoHeight, safeArea);
        setOffset(clampedOffset);
      } else {
        setOffset(newOffset);
      }

      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouchDistance) {
      // Two finger pinch zoom
      const currentDistance = getTouchDistance(e.touches);
      if (currentDistance && lastTouchDistance) {
        const scaleChange = currentDistance / lastTouchDistance;
        const newZoom = Math.max(1, Math.min(3, initialZoom * scaleChange));
        setZoom(newZoom);
      }
    }
  }, [offset, setOffset, setZoom, lastTouchDistance, initialZoom, safeRect, zoom, canvasRef]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    setLastTouchDistance(null);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!safeRect) return;
    
    const step = 10;
    const zoomStep = 0.1;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        {
          const newOffset = { x: offset.x - step, y: offset.y };
          if (photoImage.current && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const safeArea = calculateSafeArea(rect.width, rect.height, safeRect);
            const { width: photoWidth, height: photoHeight } = calculateCoverFit(
              photoImage.current.width,
              photoImage.current.height,
              safeArea,
              zoom
            );
            setOffset(clampOffset(newOffset, photoWidth, photoHeight, safeArea));
          } else {
            setOffset(newOffset);
          }
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        {
          const newOffset = { x: offset.x + step, y: offset.y };
          if (photoImage.current && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const safeArea = calculateSafeArea(rect.width, rect.height, safeRect);
            const { width: photoWidth, height: photoHeight } = calculateCoverFit(
              photoImage.current.width,
              photoImage.current.height,
              safeArea,
              zoom
            );
            setOffset(clampOffset(newOffset, photoWidth, photoHeight, safeArea));
          } else {
            setOffset(newOffset);
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        {
          const newOffset = { x: offset.x, y: offset.y - step };
          if (photoImage.current && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const safeArea = calculateSafeArea(rect.width, rect.height, safeRect);
            const { width: photoWidth, height: photoHeight } = calculateCoverFit(
              photoImage.current.width,
              photoImage.current.height,
              safeArea,
              zoom
            );
            setOffset(clampOffset(newOffset, photoWidth, photoHeight, safeArea));
          } else {
            setOffset(newOffset);
          }
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        {
          const newOffset = { x: offset.x, y: offset.y + step };
          if (photoImage.current && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const safeArea = calculateSafeArea(rect.width, rect.height, safeRect);
            const { width: photoWidth, height: photoHeight } = calculateCoverFit(
              photoImage.current.width,
              photoImage.current.height,
              safeArea,
              zoom
            );
            setOffset(clampOffset(newOffset, photoWidth, photoHeight, safeArea));
          } else {
            setOffset(newOffset);
          }
        }
        break;
      case '+':
      case '=':
        e.preventDefault();
        setZoom(Math.min(3, zoom + zoomStep));
        break;
      case '-':
        e.preventDefault();
        setZoom(Math.max(1, zoom - zoomStep));
        break;
      case '0':
        e.preventDefault();
        setOffset({ x: 0, y: 0 });
        setZoom(1);
        break;
    }
  }, [offset, setOffset, zoom, setZoom, safeRect, canvasRef]);

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
