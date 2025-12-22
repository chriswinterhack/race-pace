import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Use service role for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const gearType = formData.get("gearType") as string | null;
    const gearId = formData.get("gearId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!gearType || !gearId) {
      return NextResponse.json(
        { error: "Missing gearType or gearId" },
        { status: 400 }
      );
    }

    // Validate gear type
    const validGearTypes = ["bike", "tire", "shoe", "hydration", "bag"];
    if (!validGearTypes.includes(gearType)) {
      return NextResponse.json(
        { error: "Invalid gear type" },
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

    // Validate file size (10MB max - images should be compressed client-side)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Get file extension
    const extension = fileName.substring(fileName.lastIndexOf("."));

    // Create a unique file path
    const filePath = `${gearType}s/${gearId}-${Date.now()}${extension}`;

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

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("gear-images")
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
      .from("gear-images")
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Update the gear record with the image URL
    const tableMap: Record<string, string> = {
      bike: "user_bikes",
      tire: "user_tires",
      shoe: "user_shoes",
      hydration: "user_hydration_packs",
      bag: "user_bags",
    };

    const tableName = tableMap[gearType];
    if (tableName) {
      const { error: updateError } = await supabaseAdmin
        .from(tableName)
        .update({ image_url: publicUrl })
        .eq("id", gearId);

      if (updateError) {
        console.error("Error updating gear with image:", updateError);
        // Don't fail - file is already uploaded
      }
    }

    return NextResponse.json({
      data: {
        path: data.path,
        url: publicUrl,
      },
      error: null,
    });
  } catch (error) {
    console.error("Gear image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
