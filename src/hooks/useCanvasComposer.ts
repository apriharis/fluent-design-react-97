import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudioStore } from '@/stores/useStudioStore';
import { calculateSafeArea } from '@/lib/frameUtils';
import { calculateCoverFit, clampOffset } from '@/lib/frameDetection';
import type { SafeRect } from '@/lib/frameDetection';
import { SLOT_CONFIG } from '@/constants/slots';

interface UseCanvasComposerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  showMasks?: boolean;
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

export const useCanvasComposer = ({ canvasRef, showMasks = false }: UseCanvasComposerProps): UseCanvasComposerReturn => {
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

  // Use centralized slot configuration  
  const { LEFT_SLOT, RIGHT_SAFE, PORTRAIT_FULL } = SLOT_CONFIG;

  // Touch handling
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  // Load images
  useEffect(() => {
    if (photoDataUrl) {
      const img = new Image();
      img.onload = () => { photoImage.current = img; redraw(); };
      img.src = photoDataUrl;
    }
  }, [photoDataUrl]);

  useEffect(() => {
    if (leftPhotoDataUrl) {
      const img = new Image();
      img.onload = () => { leftPhotoImage.current = img; redraw(); };
      img.src = leftPhotoDataUrl;
    }
  }, [leftPhotoDataUrl]);

  useEffect(() => {
    if (rightPhotoDataUrl) {
      const img = new Image();
      img.onload = () => { rightPhotoImage.current = img; redraw(); };
      img.src = rightPhotoDataUrl;
    }
  }, [rightPhotoDataUrl]);

  // Load frame image only
  useEffect(() => {
    if (frameSrc) {
      const img = new Image();
      img.onload = () => { frameImage.current = img; redraw(); };
      img.src = frameSrc;
    }
  }, [frameSrc]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set canvas size with DPR for sharp rendering
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // 🔧 reset transform agar scale DPR tidak menumpuk (menghindari "penyok")
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (mode === 'portrait') {
      // Portrait mode — full bleed
      if (photoImage.current) {
        const safeArea = calculateSafeArea(rect.width, rect.height, PORTRAIT_FULL);
        drawPhotoInSlot(ctx, photoImage.current, safeArea, zoom, offset);
      }
    } else {
      // Landscape mode — dual photos
      if (leftPhotoImage.current) {
        const leftArea = calculateSafeArea(rect.width, rect.height, LEFT_SLOT);
        drawPhotoInSlot(ctx, leftPhotoImage.current, leftArea, leftZoom, leftOffset);
      }
      if (rightPhotoImage.current) {
        const rightArea = calculateSafeArea(rect.width, rect.height, RIGHT_SAFE);
        drawPhotoInSlot(ctx, rightPhotoImage.current, rightArea, rightZoom, rightOffset);
      }
    }

    // Draw frame overlay on top
    if (frameImage.current) {
      ctx.drawImage(frameImage.current, 0, 0, rect.width, rect.height);
    }

    // Debug overlay
    if (showMasks) {
      ctx.save();
      if (mode === 'portrait') {
        const r = calculateSafeArea(rect.width, rect.height, PORTRAIT_FULL);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(r.x, r.y, r.width, r.height);
        ctx.globalAlpha = 1;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x, r.y, r.width, r.height);
        ctx.setLineDash([]);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#22c55e';
        ctx.fillText(
          `PORTRAIT FULL: x=${r.x.toFixed(0)}, y=${r.y.toFixed(0)}, w=${r.width.toFixed(0)}, h=${r.height.toFixed(0)}`,
          r.x + 8, r.y + 18
        );
      } else {
        const l = calculateSafeArea(rect.width, rect.height, LEFT_SLOT);
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(l.x, l.y, l.width, l.height);
        ctx.globalAlpha = 1;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.strokeRect(l.x, l.y, l.width, l.height);
        ctx.setLineDash([]);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#60a5fa';
        ctx.fillText(
          `LEFT FULL: x=${l.x.toFixed(0)}, y=${l.y.toFixed(0)}, w=${l.width.toFixed(0)}, h=${l.height.toFixed(0)}`,
          l.x + 8, l.y + 18
        );

        const r = calculateSafeArea(rect.width, rect.height, RIGHT_SAFE);
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(r.x, r.y, r.width, r.height);
        ctx.globalAlpha = 1;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x, r.y, r.width, r.height);
        ctx.setLineDash([]);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#ec4899';
        ctx.fillText(
          `RIGHT SAFE: x=${r.x.toFixed(0)}, y=${r.y.toFixed(0)}, w=${r.width.toFixed(0)}, h=${r.height.toFixed(0)}`,
          r.x + 8, r.y + 18
        );
      }
      ctx.restore();
    }
  }, [canvasRef, mode, zoom, offset, leftZoom, leftOffset, rightZoom, rightOffset, showMasks]);

  const drawPhotoInSlot = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    safeArea: SafeRect,
    slotZoom: number,
    slotOffset: { x: number; y: number }
  ) => {
    ctx.save();

    const { width: photoWidth, height: photoHeight } = calculateCoverFit(
      image.width, image.height, safeArea, slotZoom
    );

    const clampedOffset = clampOffset(slotOffset, photoWidth, photoHeight, safeArea);

    const photoX = safeArea.x + (safeArea.width  - photoWidth)  / 2 + clampedOffset.x;
    const photoY = safeArea.y + (safeArea.height - photoHeight) / 2 + clampedOffset.y;

    // Clip to safe area
    ctx.beginPath();
    ctx.rect(safeArea.x, safeArea.y, safeArea.width, safeArea.height);
    ctx.clip();

    ctx.drawImage(image, photoX, photoY, photoWidth, photoHeight);
    ctx.restore();
  };

  // Controls for interactions
  const getCurrentSlotControls = () => {
    if (mode === 'portrait') {
      return { zoom, offset, setZoom, setOffset };
    }
    return activeSlot === 'left'
      ? { zoom: leftZoom, offset: leftOffset, setZoom: setLeftZoom, setOffset: setLeftOffset }
      : { zoom: rightZoom, offset: rightOffset, setZoom: setRightZoom, setOffset: setRightOffset };
  };

  const getCurrentSafeRect = () => {
    // 🔧 portrait interactions must use PORTRAIT_FULL
    if (mode === 'portrait') return PORTRAIT_FULL;
    return activeSlot === 'left' ? LEFT_SLOT : RIGHT_SAFE;
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

    const newOffset = { x: currentOffset.x + deltaX, y: currentOffset.y + deltaY };

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const safeArea = calculateSafeArea(rect.width, rect.height, currentSafeRect);
      const { width: photoWidth, height: photoHeight } = calculateCoverFit(
        currentImage.width, currentImage.height, safeArea, currentZoom
      );
      const clampedOffset = clampOffset(newOffset, photoWidth, photoHeight, safeArea);
      setCurrentOffset(clampedOffset);
    } else {
      setCurrentOffset(newOffset);
    }

    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, [activeSlot, mode, canvasRef]);

  const handlePointerUp = useCallback(() => { isDragging.current = false; }, []);

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
    const t1 = touches[0], t2 = touches[1];
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const { zoom: currentZoom } = getCurrentSlotControls();

    if (e.touches.length === 1) {
      isDragging.current = true;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
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
      const deltaX = e.touches[0].clientX - lastPointer.current.x;
      const deltaY = e.touches[0].clientY - lastPointer.current.y;

      const newOffset = { x: currentOffset.x + deltaX, y: currentOffset.y + deltaY };

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const safeArea = calculateSafeArea(rect.width, rect.height, currentSafeRect);
        const { width: photoWidth, height: photoHeight } = calculateCoverFit(
          currentImage.width, currentImage.height, safeArea, currentZoom
        );
        const clampedOffset = clampOffset(newOffset, photoWidth, photoHeight, safeArea);
        setCurrentOffset(clampedOffset);
      } else {
        setCurrentOffset(newOffset);
      }

      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouchDistance) {
      const currentDistance = getTouchDistance(e.touches);
      if (currentDistance) {
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

    const move = (dx = 0, dy = 0) => {
      const newOffset = { x: currentOffset.x + dx, y: currentOffset.y + dy };
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const safeArea = calculateSafeArea(rect.width, rect.height, currentSafeRect);
        const { width: photoWidth, height: photoHeight } = calculateCoverFit(
          currentImage.width, currentImage.height, safeArea, currentZoom
        );
        setCurrentOffset(clampOffset(newOffset, photoWidth, photoHeight, safeArea));
      } else {
        setCurrentOffset(newOffset);
      }
    };

    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); move(-step, 0); break;
      case 'ArrowRight': e.preventDefault(); move(+step, 0); break;
      case 'ArrowUp':    e.preventDefault(); move(0, -step); break;
      case 'ArrowDown':  e.preventDefault(); move(0, +step); break;
      case '+':
      case '=': e.preventDefault(); setCurrentZoom(Math.min(3, currentZoom + zoomStep)); break;
      case '-': e.preventDefault(); setCurrentZoom(Math.max(1, currentZoom - zoomStep)); break;
      case '0': e.preventDefault(); setCurrentOffset({ x: 0, y: 0 }); setCurrentZoom(1); break;
    }
  }, [activeSlot, mode, canvasRef]);

  // Redraw when dependencies change
  useEffect(() => { redraw(); }, [redraw]);

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
