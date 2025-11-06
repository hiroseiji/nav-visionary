import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface BannerUploadProps {
  currentBanner?: string | null;
  onBannerChange: (file: File | null) => void;
}

export default function BannerUpload({ currentBanner, onBannerChange }: BannerUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentBanner || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setPreview(URL.createObjectURL(file));
      onBannerChange(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onBannerChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="banner-upload"
      />
      
      {preview ? (
        <div className="relative border rounded-lg overflow-hidden">
          <img 
            src={preview} 
            alt="Banner preview" 
            className="w-full h-32 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="banner-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload banner image
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG up to 5MB
            </p>
          </div>
        </label>
      )}
    </div>
  );
}
