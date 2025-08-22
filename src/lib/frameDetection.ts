import { StudioMode } from '@/types/studio';

export interface SafeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Fallback configs (normalized coordinates)
export const RIGHT_HALF = { x: 0.5, y: 0.0, w: 0.5, h: 1.0 };

const FALLBACK_SAFE_RECTS: Record<StudioMode, SafeRect> = {
  portrait: { x: 0.09, y: 0.08, width: 0.82, height: 0.78 },
  landscape: { 
    x: 0.50,   // dari 0.62 → 0.575 (sedikit lebih ke tengah)
    y: 0.06,    // dari 0.12 → 0.06  (mulai lebih atas)
    width: 0.32,// dari 0.26 → 0.32  (kotak lebih lebar)
    height: 0.84// dari 0.68 → 0.84  (kotak lebih tinggi)
  },
};

// Cache for detected safe areas
const safeRectCache = new Map<string, SafeRect>();
const CACHE_KEY_PREFIX = 'frame_safe_rect_v2_';

// Load cached safe rects from localStorage
const loadCacheFromStorage = () => {
  try {
    Object.values(FALLBACK_SAFE_RECTS).forEach((_, index) => {
      const mode = Object.keys(FALLBACK_SAFE_RECTS)[index] as StudioMode;
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${mode}`);
      if (cached) {
        const safeRect = JSON.parse(cached);
        safeRectCache.set(mode, safeRect);
      }
    });
  } catch (error) {
    console.warn('Failed to load safe rect cache:', error);
  }
};

// Save safe rect to localStorage
const saveCacheToStorage = (mode: StudioMode, safeRect: SafeRect) => {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${mode}`, JSON.stringify(safeRect));
  } catch (error) {
    console.warn('Failed to save safe rect cache:', error);
  }
};

// Initialize cache from storage
loadCacheFromStorage();

// Detect white/transparent area in frame image
const detectSafeRect = (imageData: ImageData): SafeRect | null => {
  const { data, width, height } = imageData;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Check for white area (RGB >= 245, tolerance 10) or transparent (alpha <= 5)
      const isWhite = r >= 245 && g >= 245 && b >= 245;
      const isTransparent = a <= 5;
      
      if (isWhite || isTransparent) {
        found = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!found) return null;

  // Return normalized coordinates
  return {
    x: minX / width,
    y: minY / height,
    width: (maxX - minX) / width,
    height: (maxY - minY) / height,
  };
};

// Validation for landscape safeRect to avoid full-canvas detections
const isValidLandscapeRect = (rect: SafeRect): boolean => {
  if (!rect) return false;
  const x = rect.x;
  const w = rect.width;
  const h = rect.height;
  const sum = x + w;
  return x >= 0.55 && w <= 0.40 && h >= 0.45 && sum <= 0.99;
};

// Validasi landscape: harus di kanan & muat
export function isValidLandscape(rect: {x:number;y:number;width:number;height:number}) {
  const inRight = rect.x >= RIGHT_HALF.x && (rect.x + rect.width) <= (RIGHT_HALF.x + RIGHT_HALF.w);
  const okY     = rect.y >= 0 && (rect.y + rect.height) <= 1;
  const sizeOK  = rect.width > 0.18 && rect.width < 0.42 && rect.height > 0.55 && rect.height <= 0.92;
  return inRight && okY && sizeOK;
}

// Clamp agar selalu di RIGHT_HALF
function clampToRightHalf(r: {x:number;y:number;width:number;height:number}) {
  let { x, y, width, height } = r;

  width  = Math.min(width, RIGHT_HALF.w - 0.02);  // margin 2%
  height = Math.min(height, 1.0 - 0.02);

  if (x < RIGHT_HALF.x) x = RIGHT_HALF.x;

  const rightEdge = x + width;
  const maxRight  = RIGHT_HALF.x + RIGHT_HALF.w;
  if (rightEdge > maxRight) x -= (rightEdge - maxRight);

  if (y < 0) y = 0;
  if (y + height > 1) y = 1 - height;

  return { x, y, width, height };
}

// Main function to get safe rect for a mode
export const getSafeRect = async (mode: StudioMode, frameSrc: string): Promise<SafeRect> => {
  // Check cache first
  const cached = safeRectCache.get(mode);
  if (cached) {
    return cached;
  }

  try {
    // Load and analyze frame image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const loadPromise = new Promise<SafeRect>((resolve) => {
      img.onload = () => {
        try {
          // Create temporary canvas for analysis
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(FALLBACK_SAFE_RECTS[mode]);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Get image data and detect safe area
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const detected = detectSafeRect(imageData);

          // Use detected rect if valid; validate landscape to avoid full-canvas
          let safeRect: SafeRect = detected || FALLBACK_SAFE_RECTS[mode];
          if (mode === 'landscape' && detected) {
            safeRect = isValidLandscapeRect(detected) ? detected : FALLBACK_SAFE_RECTS.landscape;
          }
          
          // Cache the result
          safeRectCache.set(mode, safeRect);
          saveCacheToStorage(mode, safeRect);
          
          resolve(safeRect);
        } catch (error) {
          console.warn('Frame detection failed, using fallback:', error);
          resolve(FALLBACK_SAFE_RECTS[mode]);
        }
      };
      
      img.onerror = () => {
        console.warn('Failed to load frame image, using fallback');
        resolve(FALLBACK_SAFE_RECTS[mode]);
      };
    });

    img.src = frameSrc;
    return await loadPromise;
  } catch (error) {
    console.warn('Error in safe rect detection:', error);
    return FALLBACK_SAFE_RECTS[mode];
  }
};

// Convert normalized safe rect to actual canvas coordinates
export const denormalizeSafeRect = (safeRect: SafeRect, canvasWidth: number, canvasHeight: number): SafeRect => {
  return {
    x: safeRect.x * canvasWidth,
    y: safeRect.y * canvasHeight,
    width: safeRect.width * canvasWidth,
    height: safeRect.height * canvasHeight,
  };
};

// Calculate cover-fit dimensions with 2% bleed
export const calculateCoverFit = (
  photoWidth: number,
  photoHeight: number,
  safeRect: SafeRect,
  zoom: number = 1
): { width: number; height: number } => {
  const photoAspect = photoWidth / photoHeight;
  const safeAspect = safeRect.width / safeRect.height;
  
  // Add 2% bleed to ensure no gaps
  const bleedFactor = 1.02;
  
  let fitWidth: number;
  let fitHeight: number;
  
  if (photoAspect > safeAspect) {
    // Photo is wider - fit to height
    fitHeight = safeRect.height * bleedFactor * zoom;
    fitWidth = fitHeight * photoAspect;
  } else {
    // Photo is taller - fit to width  
    fitWidth = safeRect.width * bleedFactor * zoom;
    fitHeight = fitWidth / photoAspect;
  }
  
  return { width: fitWidth, height: fitHeight };
};

// Clamp offset to keep photo edges within safe rect
export const clampOffset = (
  offset: { x: number; y: number },
  photoWidth: number,
  photoHeight: number,
  safeRect: SafeRect
): { x: number; y: number } => {
  const maxOffsetX = Math.max(0, (photoWidth - safeRect.width) / 2);
  const maxOffsetY = Math.max(0, (photoHeight - safeRect.height) / 2);
  
  return {
    x: Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x)),
    y: Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y)),
  };
};

export function getSafeRectLandscape(detected?: {x:number;y:number;width:number;height:number}) {
  const chosen = (detected && isValidLandscape(detected))
    ? detected
    : FALLBACK_SAFE_RECTS.landscape;

  return clampToRightHalf(chosen);
}
