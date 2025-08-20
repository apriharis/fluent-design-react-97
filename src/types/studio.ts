export type StudioMode = 'portrait' | 'landscape';

export interface StudioState {
  mode: StudioMode;
  frameSrc: string;
  photoDataUrl?: string;
  leftPhotoDataUrl?: string; // For landscape left slot
  rightPhotoDataUrl?: string; // For landscape right slot
  activeSlot: 'left' | 'right'; // Which slot is being edited
  mirror: boolean;
  zoom: number;
  offset: { x: number; y: number };
  leftZoom: number; // Independent zoom for left slot
  leftOffset: { x: number; y: number }; // Independent offset for left slot
  rightZoom: number; // Independent zoom for right slot
  rightOffset: { x: number; y: number }; // Independent offset for right slot
}

export interface StudioActions {
  setMode: (mode: StudioMode) => void;
  setFrameSrc: (src: string) => void;
  setPhotoDataUrl: (dataUrl?: string) => void;
  setLeftPhotoDataUrl: (dataUrl?: string) => void;
  setRightPhotoDataUrl: (dataUrl?: string) => void;
  setActiveSlot: (slot: 'left' | 'right') => void;
  setMirror: (mirror: boolean) => void;
  setZoom: (zoom: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  setLeftZoom: (zoom: number) => void;
  setLeftOffset: (offset: { x: number; y: number }) => void;
  setRightZoom: (zoom: number) => void;
  setRightOffset: (offset: { x: number; y: number }) => void;
  reset: () => void;
}

export interface FrameMeta {
  src: string;
  aspect: number;
  safeRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type StudioStore = StudioState & StudioActions;