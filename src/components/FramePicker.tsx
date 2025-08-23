import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FRAME_ASSETS } from "@/lib/assets";
import { useStudioStore } from "@/stores/useStudioStore";
import { useNavigate } from "react-router-dom";

const FramePicker = () => {
  const navigate = useNavigate();
  const { 
    setMode, 
    setFrameSrc, 
    setPhotoDataUrl, 
    setLeftPhotoDataUrl, 
    setRightPhotoDataUrl 
  } = useStudioStore();

  const handleFrameSelect = (frameId: string) => {
    const frame = FRAME_ASSETS.find(f => f.id === frameId);
    if (!frame) return;

    // 1) set frame & mode
    setMode(frame.mode);
    setFrameSrc(frame.src);

    // 2) reset foto supaya step di /studio langsung ke kamera
    setPhotoDataUrl(undefined);
    setLeftPhotoDataUrl(undefined);
    setRightPhotoDataUrl(undefined);

    // 3) redirect ke /studio (fix untuk halaman "/")
    navigate("/studio");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {FRAME_ASSETS.map((frame) => (
        <Card key={frame.id} variant="elevated" className="overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle>{frame.name}</CardTitle>
            <CardDescription>
              Perfect for {frame.mode} oriented photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={frame.thumbnail}
                alt={`${frame.name} preview`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <Button 
              variant="gradient" 
              size="lg" 
              className="w-full"
              onClick={() => handleFrameSelect(frame.id)}
            >
              Use This Frame
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FramePicker;
