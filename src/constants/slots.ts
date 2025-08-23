/**
 * Centralized slot configuration for canvas composition
 * All slot positions and dimensions are normalized (0-1)
 */
export const SLOT_CONFIG = {
  // Left slot for landscape mode - fills left half of canvas
  LEFT_SLOT: {
    x: 0.0,
    y: 0.0,
    width: 0.5,
    height: 1.0,
  },
  
  // Right safe area for landscape mode - fixed position in frame
  RIGHT_SAFE: {
    x: 0.62,
    y: 0.12,
    width: 0.26,
    height: 0.68,
  },
  
  // Full area for portrait mode
  PORTRAIT_FULL: {
    x: 0.09,
    y: 0.08,
    width: 0.82,
    height: 0.78,
  },
} as const;

// Export types for TypeScript
export type SlotConfig = typeof SLOT_CONFIG;
export type SlotKey = keyof SlotConfig;