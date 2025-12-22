"use client";

import { useState, useEffect } from "react";
import { Loader2, ImagePlus, X, Check, RefreshCw } from "lucide-react";
import Image from "next/image";
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { toast } from "sonner";
import { useGearImageUpload } from "@/hooks";
import type { UserBike, BikeType } from "@/types/gear";
import { BIKE_TYPE_LABELS } from "@/types/gear";
import { cn } from "@/lib/utils";
import {
  compressImage,
  formatFileSize,
  revokePreviewUrl,
  type CompressedImage,
} from "@/lib/utils/image-compression";

interface BikeFormProps {
  bike?: UserBike;
  onSave: () => void;
  onCancel: () => void;
}

export function BikeForm({ bike, onSave, onCancel }: BikeFormProps) {
  const [brand, setBrand] = useState(bike?.brand || "");
  const [model, setModel] = useState(bike?.model || "");
  const [year, setYear] = useState(bike?.year?.toString() || "");
  const [bikeType, setBikeType] = useState<BikeType>(bike?.bike_type || "gravel");
  const [notes, setNotes] = useState(bike?.notes || "");
  const [imageUrl, setImageUrl] = useState(bike?.image_url || "");
  const [saving, setSaving] = useState(false);

  // Image preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [compressedImage, setCompressedImage] = useState<CompressedImage | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const { upload: uploadImage, isUploading, progress } = useGearImageUpload();

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (compressedImage?.previewUrl) {
        revokePreviewUrl(compressedImage.previewUrl);
      }
    };
  }, [compressedImage?.previewUrl]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If we don't have a bike ID yet, we need to save first
    if (!bike?.id) {
      toast.error("Please save the bike first before adding an image");
      return;
    }

    setOriginalFile(file);
    setIsCompressing(true);
    setPreviewOpen(true);

    try {
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        mimeType: "image/jpeg",
      });
      setCompressedImage(compressed);
    } catch {
      toast.error("Failed to process image");
      setPreviewOpen(false);
    }

    setIsCompressing(false);
  };

  const handleConfirmUpload = async () => {
    if (!compressedImage || !bike?.id) return;

    // Create a File object from the compressed blob
    const compressedFile = new File([compressedImage.blob], originalFile?.name || "bike-photo.jpg", {
      type: "image/jpeg",
    });

    setPreviewOpen(false);
    setImageUrl(compressedImage.previewUrl);

    const result = await uploadImage(compressedFile, "bike", bike.id);
    if (result) {
      revokePreviewUrl(compressedImage.previewUrl);
      setImageUrl(result.url);
      toast.success("Bike photo uploaded!");
    } else {
      toast.error("Failed to upload photo");
      setImageUrl(bike.image_url || "");
    }

    setCompressedImage(null);
    setOriginalFile(null);
  };

  const handleCancelPreview = () => {
    if (compressedImage?.previewUrl) {
      revokePreviewUrl(compressedImage.previewUrl);
    }
    setCompressedImage(null);
    setOriginalFile(null);
    setPreviewOpen(false);
  };

  const handleRemoveImage = () => {
    setImageUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      brand,
      model,
      year: year ? parseInt(year) : null,
      bike_type: bikeType,
      notes: notes || null,
      image_url: imageUrl || null,
    };

    try {
      const url = bike
        ? `/api/gear/inventory/bikes/${bike.id}`
        : "/api/gear/inventory/bikes";
      const method = bike ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(bike ? "Bike updated" : "Bike added");
        onSave();
      }
    } catch {
      toast.error("Failed to save bike");
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload Section */}
      <div>
        <Label>Photo</Label>
        <div className="mt-1.5">
          {imageUrl ? (
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-brand-navy-100">
              <Image
                src={imageUrl}
                alt="Bike photo"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isUploading || !bike?.id}
                  />
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg transition-colors",
                    isUploading
                      ? "bg-brand-sky-500 text-white"
                      : "bg-white/90 hover:bg-white text-brand-navy-700"
                  )}>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {progress}%
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-3.5 w-3.5" />
                        Replace
                      </>
                    )}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg bg-white/90 hover:bg-white text-red-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
                disabled={isUploading || !bike?.id}
              />
              <div className={cn(
                "w-full aspect-[16/9] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
                bike?.id
                  ? "border-brand-navy-300 hover:border-brand-sky-400 hover:bg-brand-navy-50"
                  : "border-brand-navy-200 bg-brand-navy-50 cursor-not-allowed"
              )}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-8 w-8 text-brand-sky-500 animate-spin" />
                    <span className="text-sm text-brand-sky-600">Uploading... {progress}%</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className={cn(
                      "h-8 w-8",
                      bike?.id ? "text-brand-navy-400" : "text-brand-navy-300"
                    )} />
                    <span className={cn(
                      "text-sm",
                      bike?.id ? "text-brand-navy-600" : "text-brand-navy-400"
                    )}>
                      {bike?.id ? "Click to upload a photo" : "Save bike first to add photo"}
                    </span>
                    <span className="text-xs text-brand-navy-400">JPG, PNG, or WebP (auto-compressed)</span>
                  </>
                )}
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., Specialized, Trek, Canyon"
            required
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g., Diverge, Checkpoint, Grail"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g., 2024"
            min="1990"
            max="2030"
          />
        </div>
        <div>
          <Label htmlFor="bikeType">Type</Label>
          <select
            id="bikeType"
            value={bikeType}
            onChange={(e) => setBikeType(e.target.value as BikeType)}
            className="w-full h-10 px-3 rounded-md border border-brand-navy-200 bg-white text-brand-navy-900"
          >
            {(Object.entries(BIKE_TYPE_LABELS) as [BikeType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this bike"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || isUploading}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {bike ? "Update" : "Add"} Bike
        </Button>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={(open) => !open && handleCancelPreview()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview Window - shows how image will appear */}
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-brand-navy-100 border-2 border-brand-navy-200">
              {isCompressing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-8 w-8 text-brand-sky-500 animate-spin" />
                  <span className="text-sm text-brand-navy-600">Optimizing image...</span>
                </div>
              ) : compressedImage ? (
                <>
                  <Image
                    src={compressedImage.previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </>
              ) : null}
            </div>

            {/* Compression Stats */}
            {compressedImage && (
              <div className="p-4 rounded-lg bg-brand-navy-50 border border-brand-navy-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-brand-navy-500 mb-1">Original Size</p>
                    <p className="font-medium text-brand-navy-900">
                      {formatFileSize(compressedImage.originalSize)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-navy-500 mb-1">Compressed Size</p>
                    <p className="font-medium text-brand-sky-600">
                      {formatFileSize(compressedImage.compressedSize)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-navy-500 mb-1">Saved</p>
                    <p className="font-medium text-emerald-600">
                      {compressedImage.compressionRatio}%
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-center text-brand-navy-500">
                  Resized to {compressedImage.width} x {compressedImage.height}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelPreview}
                disabled={isCompressing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isCompressing || !compressedImage}
              >
                <Check className="h-4 w-4 mr-2" />
                Use This Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
