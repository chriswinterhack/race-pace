"use client";

import { useState } from "react";
import { Loader2, Bike, Footprints, ImagePlus } from "lucide-react";
import Image from "next/image";
import { Button, Input, Label, RichTextEditor } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useHeroImageUpload } from "@/hooks";
import { toast } from "sonner";
import type { Race } from "@/types/admin";

interface EditRaceModalProps {
  race: Race;
  onClose: () => void;
  onSaved: () => void;
}

export function EditRaceModal({ race, onClose, onSaved }: EditRaceModalProps) {
  const [formData, setFormData] = useState({
    name: race.name,
    slug: race.slug,
    location: race.location || "",
    description: race.description || "",
    website_url: race.website_url || "",
    is_active: race.is_active,
    race_type: race.race_type as "bike" | "run",
    race_subtype: race.race_subtype || "",
  });
  const [saving, setSaving] = useState(false);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(race.hero_image_url || null);
  const { upload: uploadHeroImage, isUploading: isUploadingHero, progress: heroProgress } = useHeroImageUpload();

  const handleHeroImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setHeroImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload the file (API updates database directly)
    const result = await uploadHeroImage(file, race.id, race.slug);
    if (result) {
      setHeroImagePreview(result.url);
      toast.success("Hero image uploaded!");
    } else {
      toast.error("Failed to upload hero image");
      setHeroImagePreview(race.hero_image_url || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/races", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raceId: race.id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to update race");
        setSaving(false);
        return;
      }

      toast.success("Race updated!");
      onSaved();
    } catch {
      toast.error("Failed to update race");
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            Edit Race
          </h2>
          <p className="mt-1 text-sm text-brand-navy-600">
            Update race details
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-race-name">Race Name *</Label>
              <Input
                id="edit-race-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-race-slug">URL Slug *</Label>
              <Input
                id="edit-race-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
              <p className="text-xs text-brand-navy-500">
                Used in URLs: /races/{formData.slug || "slug"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-race-location">Location</Label>
              <Input
                id="edit-race-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Stillwater, OK"
              />
            </div>

            {/* Race Type Selection */}
            <div className="space-y-2">
              <Label>Race Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, race_type: "bike", race_subtype: "" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors",
                    formData.race_type === "bike"
                      ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                      : "border-brand-navy-200 hover:border-brand-navy-300"
                  )}
                >
                  <Bike className="h-5 w-5" />
                  <span className="font-medium">Cycling</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, race_type: "run", race_subtype: "" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors",
                    formData.race_type === "run"
                      ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                      : "border-brand-navy-200 hover:border-brand-navy-300"
                  )}
                >
                  <Footprints className="h-5 w-5" />
                  <span className="font-medium">Running</span>
                </button>
              </div>
            </div>

            {/* Race Subtype Selection */}
            {formData.race_type && (
              <div className="space-y-2">
                <Label>{formData.race_type === "bike" ? "Discipline" : "Race Type"} *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.race_type === "bike" ? (
                    <>
                      {["gravel", "mtb", "road"].map((subtype) => (
                        <button
                          key={subtype}
                          type="button"
                          onClick={() => setFormData({ ...formData, race_subtype: subtype })}
                          className={cn(
                            "p-3 rounded-lg border-2 text-sm font-medium transition-colors capitalize",
                            formData.race_subtype === subtype
                              ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                              : "border-brand-navy-200 hover:border-brand-navy-300"
                          )}
                        >
                          {subtype === "mtb" ? "MTB" : subtype}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {["trail", "ultra", "road"].map((subtype) => (
                        <button
                          key={subtype}
                          type="button"
                          onClick={() => setFormData({ ...formData, race_subtype: subtype })}
                          className={cn(
                            "p-3 rounded-lg border-2 text-sm font-medium transition-colors capitalize",
                            formData.race_subtype === subtype
                              ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                              : "border-brand-navy-200 hover:border-brand-navy-300"
                          )}
                        >
                          {subtype}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-race-website">Website URL</Label>
              <Input
                id="edit-race-website"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Add a description of the race..."
                minHeight="120px"
              />
            </div>

            {/* Hero Image Upload */}
            <div className="space-y-2">
              <Label>Hero Image</Label>
              <p className="text-xs text-brand-navy-500">
                Landscape image (16:9 ratio) for race cards. Recommended: 1200x675px
              </p>
              <div className="mt-2">
                {heroImagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-brand-navy-200">
                    <div className="aspect-video relative">
                      <Image
                        src={heroImagePreview}
                        alt="Hero image preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-white text-sm font-medium drop-shadow-lg">
                        {race.name}
                      </span>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleHeroImageSelect}
                          className="hidden"
                          disabled={isUploadingHero}
                        />
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          isUploadingHero
                            ? "bg-white/50 text-brand-navy-600"
                            : "bg-white/90 text-brand-navy-700 hover:bg-white"
                        )}>
                          {isUploadingHero ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {heroProgress}%
                            </>
                          ) : (
                            <>
                              <ImagePlus className="h-3.5 w-3.5" />
                              Replace
                            </>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleHeroImageSelect}
                      className="hidden"
                      disabled={isUploadingHero}
                    />
                    <div className={cn(
                      "aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
                      isUploadingHero
                        ? "border-brand-sky-300 bg-brand-sky-50"
                        : "border-brand-navy-200 hover:border-brand-sky-400 hover:bg-brand-sky-50/50"
                    )}>
                      {isUploadingHero ? (
                        <>
                          <Loader2 className="h-8 w-8 text-brand-sky-500 animate-spin" />
                          <span className="text-sm text-brand-sky-600">Uploading... {heroProgress}%</span>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-8 w-8 text-brand-navy-400" />
                          <span className="text-sm text-brand-navy-600">Click to upload hero image</span>
                          <span className="text-xs text-brand-navy-400">JPG, PNG, or WebP up to 5MB</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-race-active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-brand-navy-300 text-brand-sky-600 focus:ring-brand-sky-500"
              />
              <Label htmlFor="edit-race-active" className="text-sm font-normal">
                Active (visible to athletes)
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !formData.race_type || !formData.race_subtype}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
