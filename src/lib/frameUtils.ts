import { StudioMode, FrameMeta } from '@/types/studio';
import { getFrameAsset } from './assets';
import { getSafeRect, denormalizeSafeRect } from './frameDetection';

// Frame aspect ratios
const FRAME_ASPECTS = {
  portrait: 3 / 4, // 3:4 ratio
  landscape: 4 / 3, // 4:3 ratio
};

export const getFrameMeta = async (mode: StudioMode): Promise<FrameMeta | null> => {
  const asset = getFrameAsset(mode);
  const aspect = FRAME_ASPECTS[mode];
  
  if (!asset || !aspect) {
    return null;
  }

  // Get auto-detected safe rect
  const safeRect = await getSafeRect(mode, asset.src);

  return {
    src: asset.src,
    aspect,
    safeRect,
  };
};

export const calculateSafeArea = (
  frameWidth: number,
  frameHeight: number,
  safeRect: { x: number; y: number; width: number; height: number }
) => {
  return denormalizeSafeRect(safeRect, frameWidth, frameHeight);
};