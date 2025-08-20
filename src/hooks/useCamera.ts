import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface UseCameraReturn {
  ready: boolean;
  startCountdown: () => Promise<void>;
  capture: () => string | null;
  error: string | null;
  mirrored: boolean;
  toggleMirror: () => void;
  webcamRef: React.RefObject<Webcam>;
  isCountingDown: boolean;
  countdown: number;
  devices: CameraDevice[];
  selectedDeviceId: string;
  setSelectedDeviceId: (deviceId: string) => void;
  handleUserMedia: () => void;
  handleUserMediaError: (error: string | DOMException) => void;
}

export const useCamera = (): UseCameraReturn => {
  const webcamRef = useRef<Webcam>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Enumerate camera devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
          }));
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
      }
    };

    getDevices();
  }, [selectedDeviceId]);

  // Enhanced ready state detection
  useEffect(() => {
    if (!webcamRef.current) return;

    let checkInterval: NodeJS.Timeout;
    let fallbackTimeout: NodeJS.Timeout;

    const checkVideoReady = () => {
      const video = webcamRef.current?.video;
      if (video && video.readyState >= 2) { // HAVE_CURRENT_DATA
        setReady(true);
        setError(null);
        clearInterval(checkInterval);
        clearTimeout(fallbackTimeout);
      }
    };

    const checkStreamReady = () => {
      const video = webcamRef.current?.video;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0 && tracks[0].readyState === 'live') {
          setReady(true);
          setError(null);
          clearInterval(checkInterval);
          clearTimeout(fallbackTimeout);
        }
      }
    };

    // Check periodically
    checkInterval = setInterval(() => {
      checkVideoReady();
      checkStreamReady();
    }, 100);

    // Fallback timeout after 2 seconds
    fallbackTimeout = setTimeout(() => {
      checkStreamReady();
      clearInterval(checkInterval);
    }, 2000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const getHumanReadableError = (error: string | DOMException): string => {
    if (typeof error === 'string') return error;
    
    const errorName = error.name?.toLowerCase() || '';
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorName.includes('notallowed') || errorMessage.includes('permission')) {
      return 'Camera permission denied. Please allow camera access and refresh the page.';
    }
    if (errorName.includes('notfound') || errorMessage.includes('not found')) {
      return 'No camera found. Please connect a camera and refresh the page.';
    }
    if (errorName.includes('notreadable') || errorMessage.includes('in use')) {
      return 'Camera is already in use by another application. Please close other camera apps and refresh.';
    }
    if (errorName.includes('overconstrained')) {
      return 'Camera settings not supported. Trying with different settings...';
    }
    
    return 'Camera access failed. Please check your camera and try again.';
  };

  const toggleMirror = useCallback(() => {
    setMirrored(prev => !prev);
  }, []);

  const startCountdown = useCallback(async (): Promise<void> => {
    if (!ready || isCountingDown) return;

    setIsCountingDown(true);
    
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCountdown(0);
    setIsCountingDown(false);
  }, [ready, isCountingDown]);

  const capture = useCallback((): string | null => {
    if (!webcamRef.current || !ready) {
      setError('Camera not ready');
      return null;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1920,
        height: 1080,
      });
      
      setError(null);
      return imageSrc;
    } catch (err) {
      setError('Failed to capture photo');
      return null;
    }
  }, [ready]);

  const handleUserMedia = useCallback(() => {
    setReady(true);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    setReady(false);
    const humanError = getHumanReadableError(error);
    setError(humanError);
  }, []);

  return {
    ready,
    startCountdown,
    capture,
    error,
    mirrored,
    toggleMirror,
    webcamRef,
    isCountingDown,
    countdown,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    handleUserMedia,
    handleUserMediaError,
  };
};