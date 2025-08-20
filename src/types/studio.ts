export type StudioMode = 'portrait' | 'landscape';

export interface StudioState {
  mode: StudioMode;
  frameSrc: string;
  photoDataUrl?: string;
  mirror: boolean;
  zoom: number;
  offset: { x: number; y: number };
}

export interface StudioActions {
  setMode: (mode: StudioMode) => void;
  setFrameSrc: (src: string) => void;
  setPhotoDataUrl: (dataUrl?: string) => void;
  setMirror: (mirror: boolean) => void;
  setZoom: (zoom: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
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