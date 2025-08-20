import { create } from 'zustand';
import { StudioStore, StudioState } from '@/types/studio';

const initialState: StudioState = {
  mode: 'portrait',
  frameSrc: '',
  photoDataUrl: undefined,
  mirror: true, // Mirror ON by default for better UX
  zoom: 1,
  offset: { x: 0, y: 0 },
};

const validateZoom = (zoom: number): number => {
  return Math.max(1, Math.min(3, zoom));
};

export const useStudioStore = create<StudioStore>((set) => ({
  ...initialState,
  
  setMode: (mode) => set({ mode }),
  
  setFrameSrc: (frameSrc) => set({ frameSrc }),
  
  setPhotoDataUrl: (photoDataUrl) => set({ photoDataUrl }),
  
  setMirror: (mirror) => set({ mirror }),
  
  setZoom: (zoom) => set({ zoom: validateZoom(zoom) }),
  
  setOffset: (offset) => set({ offset }),
  
  reset: () => set(initialState),
}));