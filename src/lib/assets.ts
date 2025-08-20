import { StudioMode } from '@/types/studio';
import framePortrait from '@/assets/Frame-Portrait.png';
import frameLandscape from '@/assets/Frame-Landscape.png';

export interface FrameAsset {
  id: string;
  name: string;
  mode: StudioMode;
  src: string;
  thumbnail: string;
}

export const FRAME_ASSETS: FrameAsset[] = [
  {
    id: 'portrait',
    name: 'Portrait Frame',
    mode: 'portrait',
    src: framePortrait,
    thumbnail: framePortrait,
  },
  {
    id: 'landscape', 
    name: 'Landscape Frame',
    mode: 'landscape',
    src: frameLandscape,
    thumbnail: frameLandscape,
  },
];

export const getFrameAsset = (mode: StudioMode): FrameAsset | undefined => {
  return FRAME_ASSETS.find(frame => frame.mode === mode);
};