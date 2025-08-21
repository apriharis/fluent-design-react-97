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

  try {
    const frameMeta = await getFrameMeta(mode);
    if (!frameMeta) {
      throw new Error('Failed to get frame metadata');
    }

    // Set canvas dimensions (high resolution for better quality)
    const exportWidth = 1920;
    const exportHeight = Math.round(exportWidth / frameMeta.aspect);
    const safeArea = calculateSafeArea(exportWidth, exportHeight, frameMeta.safeRect);

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = exportWidth;
      canvas.height = exportHeight;

      // Load images (right photo always, left photo optional for landscape)
      const rightImg = new Image();
      rightImg.crossOrigin = 'anonymous';

      const proceedWithFrame = (leftImg?: HTMLImageElement) => {
        // Load frame image
        const frameImg = new Image();
        frameImg.crossOrigin = 'anonymous';
        frameImg.onload = () => {
          try {
            // Clear canvas with white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, exportWidth, exportHeight);

            if (mode === 'portrait') {
              // Portrait: single photo in detected safe area
              const portraitSafeArea = calculateSafeArea(exportWidth, exportHeight, frameMeta.safeRect);
              const { width: photoWidth, height: photoHeight } = calculateCoverFit(
                rightImg.width,
                rightImg.height,
                portraitSafeArea,
                zoom
              );
              const clampedOffset = clampOffset(offset, photoWidth, photoHeight, portraitSafeArea);
              const photoX = portraitSafeArea.x + (portraitSafeArea.width - photoWidth) / 2 + clampedOffset.x;
              const photoY = portraitSafeArea.y + (portraitSafeArea.height - photoHeight) / 2 + clampedOffset.y;

              ctx.save();
              ctx.beginPath();
              ctx.rect(portraitSafeArea.x, portraitSafeArea.y, portraitSafeArea.width, portraitSafeArea.height);
              ctx.clip();
              ctx.drawImage(rightImg, photoX, photoY, photoWidth, photoHeight);
              ctx.restore();
            } else {
              // Landscape: left and right slots
              // Right slot (detected safe area)
              const rightSafeArea = calculateSafeArea(exportWidth, exportHeight, frameMeta.safeRect);
              const { width: rWidth, height: rHeight } = calculateCoverFit(
                rightImg.width,
                rightImg.height,
                rightSafeArea,
                zoom
              );
              const rClamped = clampOffset(offset, rWidth, rHeight, rightSafeArea);
              const rX = rightSafeArea.x + (rightSafeArea.width - rWidth) / 2 + rClamped.x;
              const rY = rightSafeArea.y + (rightSafeArea.height - rHeight) / 2 + rClamped.y;

              ctx.save();
              ctx.beginPath();
              ctx.rect(rightSafeArea.x, rightSafeArea.y, rightSafeArea.width, rightSafeArea.height);
              ctx.clip();
              ctx.drawImage(rightImg, rX, rY, rWidth, rHeight);
              ctx.restore();

              // Left slot (predefined left area covering left side)
              if (leftImg && options.leftPhoto) {
                const leftSafeNorm = { x: 0.05, y: 0.1, width: 0.5, height: 0.8 };
                const leftSafeArea = calculateSafeArea(exportWidth, exportHeight, leftSafeNorm);
                const { width: lWidth, height: lHeight } = calculateCoverFit(
                  leftImg.width,
                  leftImg.height,
                  leftSafeArea,
                  options.leftZoom ?? 1
                );
                const lOffset = options.leftOffset ?? { x: 0, y: 0 };
                const lClamped = clampOffset(lOffset, lWidth, lHeight, leftSafeArea);
                const lX = leftSafeArea.x + (leftSafeArea.width - lWidth) / 2 + lClamped.x;
                const lY = leftSafeArea.y + (leftSafeArea.height - lHeight) / 2 + lClamped.y;

                ctx.save();
                ctx.beginPath();
                ctx.rect(leftSafeArea.x, leftSafeArea.y, leftSafeArea.width, leftSafeArea.height);
                ctx.clip();
                ctx.drawImage(leftImg, lX, lY, lWidth, lHeight);
                ctx.restore();
              }
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