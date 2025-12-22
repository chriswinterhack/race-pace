import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const raceId = formData.get("raceId") as string | null;
    const raceSlug = formData.get("raceSlug") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!raceId || !raceSlug) {
      return NextResponse.json(
        { error: "Missing raceId or raceSlug" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return NextResponse.json(
        { error: "File must be an image (JPG, PNG, or WebP)" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max for hero images - they should be high quality)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Get file extension
    const extension = fileName.substring(fileName.lastIndexOf("."));

    // Sanitize filename for storage
    const sanitizedSlug = raceSlug
      .replace(/[^\w-]/g, "")
      .toLowerCase();

    // Create a unique file path
    const filePath = `hero-images/${sanitizedSlug}-${Date.now()}${extension}`;

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type
    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    const contentType = contentTypeMap[extension] || "image/jpeg";

    // Upload to Supabase Storage (use race-logos bucket which allows images)
    const { data, error } = await supabaseAdmin.storage
      .from("race-logos")
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("race-logos")
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Update the race record with the hero image URL
    const { error: updateError } = await supabaseAdmin
      .from("races")
      .update({ hero_image_url: publicUrl })
      .eq("id", raceId);

    if (updateError) {
      console.error("Error updating race with hero image:", updateError);
      // Don't fail - file is already uploaded
    }

    return NextResponse.json({
      data: {
        path: data.path,
        url: publicUrl,
      },
      error: null,
    });
  } catch (error) {
    console.error("Hero image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
