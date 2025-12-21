import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { DOMParser } from "@xmldom/xmldom";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Haversine formula for distance between two points in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Parse GPX and calculate total distance and elevation stats
function parseGPXStats(gpxText: string): { totalDistanceMiles: number; elevationGain: number; elevationLoss: number; elevationHigh: number; elevationLow: number } | null {
  try {
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxText, "text/xml");

    const trackPoints = gpxDoc.getElementsByTagName("trkpt");
    if (trackPoints.length === 0) {
      return null;
    }

    let totalDistance = 0;
    let totalGain = 0;
    let totalLoss = 0;
    let prevLat: number | null = null;
    let prevLon: number | null = null;
    let prevElevation: number | null = null;
    let minElev = Infinity;
    let maxElev = -Infinity;

    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints.item(i);
      if (!point) continue;
      const lat = parseFloat(point.getAttribute("lat") || "0");
      const lon = parseFloat(point.getAttribute("lon") || "0");
      const eleElements = point.getElementsByTagName("ele");
      const firstEle = eleElements.item(0);
      const elevation = firstEle ? parseFloat(firstEle.textContent || "0") : 0;

      // Convert elevation from meters to feet
      const elevationFt = elevation * 3.28084;

      // Track min/max elevation
      if (elevationFt < minElev) minElev = elevationFt;
      if (elevationFt > maxElev) maxElev = elevationFt;

      // Calculate elevation gain/loss
      if (prevElevation !== null) {
        const elevDiff = elevationFt - prevElevation;
        if (elevDiff > 0) {
          totalGain += elevDiff;
        } else {
          totalLoss += Math.abs(elevDiff);
        }
      }
      prevElevation = elevationFt;

      if (prevLat !== null && prevLon !== null) {
        const distanceKm = haversineDistance(prevLat, prevLon, lat, lon);
        totalDistance += distanceKm * 0.621371; // Convert to miles
      }

      prevLat = lat;
      prevLon = lon;
    }

    return {
      totalDistanceMiles: Math.round(totalDistance * 10) / 10,
      elevationGain: Math.round(totalGain),
      elevationLoss: Math.round(totalLoss),
      elevationHigh: Math.round(maxElev),
      elevationLow: Math.round(minElev),
    };
  } catch (err) {
    console.error("Error parsing GPX:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const raceSlug = formData.get("raceSlug") as string | null;
    const year = formData.get("year") as string | null;
    const distanceId = formData.get("distanceId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!raceSlug || !year) {
      return NextResponse.json(
        { error: "Missing raceSlug or year" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".gpx")) {
      return NextResponse.json(
        { error: "File must be a GPX file" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Create a unique file path
    const filePath = `${raceSlug}/${year}/${Date.now()}-${file.name}`;

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("gpx-files")
      .upload(filePath, buffer, {
        contentType: "application/gpx+xml",
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
      .from("gpx-files")
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Parse GPX to get stats
    const gpxText = buffer.toString("utf-8");
    const gpxStats = parseGPXStats(gpxText);

    // If distanceId provided, update the race_distances record with URL and stats
    if (distanceId) {
      const updateData: Record<string, unknown> = { gpx_file_url: publicUrl };

      if (gpxStats) {
        updateData.gpx_distance_miles = gpxStats.totalDistanceMiles;
        updateData.elevation_gain = gpxStats.elevationGain;
        updateData.elevation_loss = gpxStats.elevationLoss;
        updateData.elevation_high = gpxStats.elevationHigh;
        updateData.elevation_low = gpxStats.elevationLow;
      }

      const { error: updateError } = await supabaseAdmin
        .from("race_distances")
        .update(updateData)
        .eq("id", distanceId);

      if (updateError) {
        console.error("Error updating race_distances:", updateError);
        // Don't fail the request, file is already uploaded
      }
    }

    return NextResponse.json({
      data: {
        path: data.path,
        url: publicUrl,
        stats: gpxStats,
      },
      error: null,
    });
  } catch (error) {
    console.error("GPX upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
