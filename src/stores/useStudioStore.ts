import { create } from 'zustand';
import { StudioStore, StudioState } from '@/types/studio';

const initialState: StudioState = {
  mode: 'portrait',
  frameSrc: '',
  photoDataUrl: undefined,
  leftPhotoDataUrl: undefined,
  rightPhotoDataUrl: undefined,
  activeSlot: 'right',
  mirror: true, // Mirror ON by default for better UX
  zoom: 1,
  offset: { x: 0, y: 0 },
  leftZoom: 1,
  leftOffset: { x: 0, y: 0 },
  rightZoom: 1,
  rightOffset: { x: 0, y: 0 },
};

const validateZoom = (zoom: number): number => {
  return Math.max(1, Math.min(3, zoom));
};

export const useStudioStore = create<StudioStore>((set) => ({
  ...initialState,
  
  setMode: (mode) => set({ mode }),
  
  setFrameSrc: (frameSrc) => set({ frameSrc }),
  
  setPhotoDataUrl: (photoDataUrl) => set({ photoDataUrl }),
  
  setLeftPhotoDataUrl: (leftPhotoDataUrl) => set({ leftPhotoDataUrl }),
  
  setRightPhotoDataUrl: (rightPhotoDataUrl) => set({ rightPhotoDataUrl }),
  
  setActiveSlot: (activeSlot) => set({ activeSlot }),
  
  setMirror: (mirror) => set({ mirror }),
  
  setZoom: (zoom) => set({ zoom: validateZoom(zoom) }),
  
  setOffset: (offset) => set({ offset }),
  
  setLeftZoom: (leftZoom) => set({ leftZoom: validateZoom(leftZoom) }),
  
  setLeftOffset: (leftOffset) => set({ leftOffset }),
  
  setRightZoom: (rightZoom) => set({ rightZoom: validateZoom(rightZoom) }),
  
  setRightOffset: (rightOffset) => set({ rightOffset }),
  
  reset: () => set(initialState),
}));