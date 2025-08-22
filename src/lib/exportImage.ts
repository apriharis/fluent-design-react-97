import { getFrameMeta, calculateSafeArea } from './frameUtils';
import { calculateCoverFit, clampOffset } from './frameDetection';
import { StudioMode } from '@/types/studio';

export interface ExportOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
  // For landscape dual-slot composition
  leftPhoto?: string;
  leftZoom?: number;
  leftOffset?: { x: number; y: number };
}

export const exportImage = async (
  photoDataUrl: string,
  frameSrc: string,
  mode: StudioMode,
  zoom: number,
  offset: { x: number; y: number },
  options: ExportOptions = {}
): Promise<void> => {
  const { format = 'png', quality = 0.9 } = options;

  // Fixed slot definitions (same as preview)
  const LEFT_SLOT = { x: 0.0, y: 0.0, width: 0.5, height: 1.0 };
  const RIGHT_SAFE = { x: 0.62, y: 0.12, width: 0.26, height: 0.68 };

  try {
    // Set canvas dimensions (high resolution for better quality)
    const exportWidth = 1920;
    const exportHeight = 1440; // Fixed 4:3 aspect ratio

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = exportWidth;
      canvas.height = exportHeight;

      const drawPhotoInSlot = (
        image: HTMLImageElement,
        safeArea: { x: number; y: number; width: number; height: number },
        slotZoom: number,
        slotOffset: { x: number; y: number }
      ) => {
        const { width: photoWidth, height: photoHeight } = calculateCoverFit(
          image.width,
          image.height,
          safeArea,
          slotZoom
        );

        const clampedOffset = clampOffset(slotOffset, photoWidth, photoHeight, safeArea);
        const photoX = safeArea.x + (safeArea.width - photoWidth) / 2 + clampedOffset.x;
        const photoY = safeArea.y + (safeArea.height - photoHeight) / 2 + clampedOffset.y;

        ctx.save();
        ctx.beginPath();
        ctx.rect(safeArea.x, safeArea.y, safeArea.width, safeArea.height);
        ctx.clip();
        ctx.drawImage(image, photoX, photoY, photoWidth, photoHeight);
        ctx.restore();
      };

      // Load images (right photo always, left photo optional for landscape)
      const rightImg = new Image();
      rightImg.crossOrigin = 'anonymous';

      const proceedWithFrame = (leftImg?: HTMLImageElement) => {
        // Load frame image
        const frameImg = new Image();
        frameImg.crossOrigin = 'anonymous';
        frameImg.onload = () => {
          try {
            // Clear canvas (no white fill to avoid background in left slot)
            ctx.clearRect(0, 0, exportWidth, exportHeight);

            if (mode === 'portrait') {
              // Portrait: single photo in right safe area
              const safeArea = calculateSafeArea(exportWidth, exportHeight, RIGHT_SAFE);
              drawPhotoInSlot(rightImg, safeArea, zoom, offset);
            } else {
              // Landscape: dual photos with fixed layout
              // Left photo fills entire left half
              if (leftImg && options.leftPhoto) {
                const leftArea = calculateSafeArea(exportWidth, exportHeight, LEFT_SLOT);
                drawPhotoInSlot(leftImg, leftArea, options.leftZoom ?? 1, options.leftOffset ?? { x: 0, y: 0 });
              }

              // Right photo locked to safe rect
              const rightArea = calculateSafeArea(exportWidth, exportHeight, RIGHT_SAFE);
              drawPhotoInSlot(rightImg, rightArea, zoom, offset);
            }

            // Draw frame overlay on top
            ctx.drawImage(frameImg, 0, 0, exportWidth, exportHeight);

            // Convert to blob and download
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to create image blob'));
                  return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                
                link.href = url;
                link.download = `volab-${timestamp}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                resolve();
              },
              format === 'jpeg' ? 'image/jpeg' : 'image/png',
              quality
            );
          } catch (error) {
            reject(error);
          }
        };

        frameImg.onerror = () => reject(new Error('Failed to load frame image'));
        frameImg.src = frameSrc;
      };

      rightImg.onload = () => {
        if (mode === 'landscape' && options.leftPhoto) {
          const leftImg = new Image();
          leftImg.crossOrigin = 'anonymous';
          leftImg.onload = () => proceedWithFrame(leftImg);
          leftImg.onerror = () => reject(new Error('Failed to load left photo image'));
          leftImg.src = options.leftPhoto!;
        } else {
          proceedWithFrame();
        }
      };
      
      rightImg.onerror = () => reject(new Error('Failed to load photo image'));
      rightImg.src = photoDataUrl;
    });
  } catch (error) {
    throw error;
  }
};