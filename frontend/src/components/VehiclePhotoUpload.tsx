import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, Link, X, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";

interface VehiclePhotoUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
}

export const VehiclePhotoUpload = ({ value, onChange }: VehiclePhotoUploadProps) => {
  const [activeTab, setActiveTab] = useState<"file" | "camera" | "url">("file");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File Upload Handler with Canvas Compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 768;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        onChange(dataUrl);
        toast.success("Vehicle photo uploaded successfully!");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Live Camera Capture Handlers
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setIsCameraActive(false);
      toast.error("Camera access denied or unavailable. Please upload a photo file instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 600;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    onChange(dataUrl);
    toast.success("Vehicle photo captured from camera!");
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }
    onChange(urlInput.trim());
    toast.success("Vehicle photo URL applied!");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Camera className="h-4 w-4 text-primary" /> Vehicle Photo / Image
        </label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => {
              onChange("");
              stopCamera();
            }}
          >
            <X className="h-3.5 w-3.5 mr-1" /> Remove Photo
          </Button>
        )}
      </div>

      {value ? (
        <div className="relative rounded-lg overflow-hidden border bg-slate-950 group h-52 w-full">
          <img src={value} alt="Vehicle Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onChange("");
                fileInputRef.current?.click();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Retake / Change Photo
            </Button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur">
            Photo Attached
          </div>
        </div>
      ) : isCameraActive ? (
        <div className="relative rounded-lg overflow-hidden border bg-black h-64 flex flex-col items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline />
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
            <Button type="button" variant="destructive" size="sm" onClick={stopCamera}>
              Cancel
            </Button>
            <Button type="button" variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={capturePhoto}>
              <Camera className="h-4 w-4 mr-1.5" /> Snap Photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b pb-2">
            <Button
              type="button"
              variant={activeTab === "file" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setActiveTab("file")}
            >
              <Upload className="h-3.5 w-3.5 mr-1" /> Upload File
            </Button>
            <Button
              type="button"
              variant={activeTab === "camera" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => {
                setActiveTab("camera");
                startCamera();
              }}
            >
              <Camera className="h-3.5 w-3.5 mr-1" /> Capture Live Photo
            </Button>
            <Button
              type="button"
              variant={activeTab === "url" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setActiveTab("url")}
            >
              <Link className="h-3.5 w-3.5 mr-1" /> Image URL
            </Button>
          </div>

          {activeTab === "file" && (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click or tap to upload vehicle photo</p>
              <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP files (Auto-compressed)</p>
            </div>
          )}

          {activeTab === "url" && (
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/vehicle-photo.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={handleApplyUrl}>
                <Check className="h-4 w-4 mr-1" /> Apply
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
