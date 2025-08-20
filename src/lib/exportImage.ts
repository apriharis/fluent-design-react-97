import { getFrameMeta, calculateSafeArea } from './frameUtils';
import { calculateCoverFit, clampOffset } from './frameDetection';
import { StudioMode } from '@/types/studio';

export interface ExportOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
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

      // Load photo image
      const photoImg = new Image();
      photoImg.crossOrigin = 'anonymous';
      photoImg.onload = () => {
        // Load frame image
        const frameImg = new Image();
        frameImg.crossOrigin = 'anonymous';
        frameImg.onload = () => {
          try {
            // Clear canvas with white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, exportWidth, exportHeight);

            // Calculate cover-fit dimensions with 2% bleed
            const { width: photoWidth, height: photoHeight } = calculateCoverFit(
              photoImg.width,
              photoImg.height,
              safeArea,
              zoom
            );

            // Apply clamped offset
            const clampedOffset = clampOffset(offset, photoWidth, photoHeight, safeArea);

            const photoX = safeArea.x + (safeArea.width - photoWidth) / 2 + clampedOffset.x;
            const photoY = safeArea.y + (safeArea.height - photoHeight) / 2 + clampedOffset.y;

            // Clip to safe area and draw photo
            ctx.save();
            ctx.beginPath();
            ctx.rect(safeArea.x, safeArea.y, safeArea.width, safeArea.height);
            ctx.clip();
            ctx.drawImage(photoImg, photoX, photoY, photoWidth, photoHeight);
            ctx.restore();

            // Draw frame overlay
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
      
      photoImg.onerror = () => reject(new Error('Failed to load photo image'));
      photoImg.src = photoDataUrl;
    });
  } catch (error) {
    throw error;
  }
};