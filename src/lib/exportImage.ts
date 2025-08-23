import { getFrameMeta, calculateSafeArea } from './frameUtils';
import { calculateCoverFit, clampOffset } from './frameDetection';
import { StudioMode } from '@/types/studio';
import { SLOT_CONFIG } from '@/constants/slots';

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

  // Use centralized slot configuration
  const { LEFT_SLOT, RIGHT_SAFE, PORTRAIT_FULL } = SLOT_CONFIG;

  try {
    // Set canvas dimensions (high resolution for better quality)
    const exportWidth = 1920;
    const exportHeight = 1440; // Fixed 4:3 aspect ratio

    if (mode === 'portrait') {
      const exportWidth = 1440;
      const exportHeight = 1920; // 3:4 aspect
    }

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
            // PATCH: pakai ukuran asli frame
            const exportWidth = frameImg.naturalWidth;
            const exportHeight = frameImg.naturalHeight;

            canvas.width = exportWidth;
            canvas.height = exportHeight;

            ctx.clearRect(0, 0, exportWidth, exportHeight);

            if (mode === 'portrait') {
              const safeArea = calculateSafeArea(exportWidth, exportHeight, PORTRAIT_FULL);
              drawPhotoInSlot(rightImg, safeArea, zoom, offset);
            } else {
              // landscape logic (left + right)
              if (leftImg && options.leftPhoto) {
                const leftArea = calculateSafeArea(exportWidth, exportHeight, LEFT_SLOT);
                drawPhotoInSlot(leftImg, leftArea, options.leftZoom ?? 1, options.leftOffset ?? { x: 0, y: 0 });
              }
              const rightArea = calculateSafeArea(exportWidth, exportHeight, RIGHT_SAFE);
              drawPhotoInSlot(rightImg, rightArea, zoom, offset);
            }

            // terakhir: gambar frame ukuran asli
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