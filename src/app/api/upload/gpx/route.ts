import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { DOMParser } from "@xmldom/xmldom";
import { requireAdmin } from "@/lib/auth/admin";
import { haversineDistance } from "@/lib/utils";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Course profile analysis result
interface CourseProfileResult {
  climbingPct: number;
  flatPct: number;
  descentPct: number;
  avgClimbGrade: number;
  avgDescentGrade: number;
}

// Grade thresholds for terrain classification
const GRADE_THRESHOLDS = {
  climb: 2.0,    // >= 2% is climbing
  descent: -2.0, // <= -2% is descending
};

// Minimum elevation change threshold to filter GPS noise (in feet)
// ~4.5 meters threshold matches what platforms like RideWithGPS use
const ELEVATION_THRESHOLD_FT = 15;

// Parse GPX and calculate total distance, elevation stats, and course profile
function parseGPXStats(gpxText: string): {
  totalDistanceMiles: number;
  elevationGain: number;
  elevationLoss: number;
  elevationHigh: number;
  elevationLow: number;
  courseProfile: CourseProfileResult;
} | null {
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
    let minElev = Infinity;
    let maxElev = -Infinity;

    // Threshold-based elevation tracking to filter GPS noise
    // We track a "reference elevation" and only count gain/loss when
    // the elevation change exceeds the threshold
    let referenceElevation: number | null = null;

    // Course profile tracking
    let climbingDistance = 0;
    let flatDistance = 0;
    let descentDistance = 0;
    let climbingGradeSum = 0;
    let climbingSegments = 0;
    let descentGradeSum = 0;
    let descentSegments = 0;
    let prevElevationForGrade: number | null = null;

    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints.item(i);
      if (!point) continue;
      const lat = parseFloat(point.getAttribute("lat") || "0");
      const lon = parseFloat(point.getAttribute("lon") || "0");
      const eleElements = point.getElementsByTagName("ele");
      const firstEle = eleElements.item(0);
      const elevationMeters = firstEle ? parseFloat(firstEle.textContent || "0") : 0;

      // Convert elevation from meters to feet for storage
      const elevationFt = elevationMeters * 3.28084;

      // Track min/max elevation
      if (elevationFt < minElev) minElev = elevationFt;
      if (elevationFt > maxElev) maxElev = elevationFt;

      // Initialize reference elevation on first point
      if (referenceElevation === null) {
        referenceElevation = elevationFt;
      }

      // Threshold-based elevation gain/loss calculation
      // This filters out GPS noise by only counting changes that exceed the threshold
      const elevDiffFromRef = elevationFt - referenceElevation;

      if (elevDiffFromRef > ELEVATION_THRESHOLD_FT) {
        // We've climbed significantly - count the gain and reset reference
        totalGain += elevDiffFromRef;
        referenceElevation = elevationFt;
      } else if (elevDiffFromRef < -ELEVATION_THRESHOLD_FT) {
        // We've descended significantly - count the loss and reset reference
        totalLoss += Math.abs(elevDiffFromRef);
        referenceElevation = elevationFt;
      }
      // If within threshold, don't count it (GPS noise) and don't reset reference

      if (prevLat !== null && prevLon !== null) {
        const segmentDistanceKm = haversineDistance(prevLat, prevLon, lat, lon);
        const segmentDistanceMeters = segmentDistanceKm * 1000;
        totalDistance += segmentDistanceKm * 0.621371; // Convert to miles

        // Calculate grade for course profile (still uses raw elevation for grade classification)
        if (prevElevationForGrade !== null && segmentDistanceMeters > 0) {
          const elevDiffMeters = elevationMeters - (prevElevationForGrade / 3.28084);

          // Calculate grade for this segment (in percent)
          const gradePct = (elevDiffMeters / segmentDistanceMeters) * 100;

          // Classify terrain and track
          if (gradePct >= GRADE_THRESHOLDS.climb) {
            climbingDistance += segmentDistanceMeters;
            climbingGradeSum += gradePct;
            climbingSegments++;
          } else if (gradePct <= GRADE_THRESHOLDS.descent) {
            descentDistance += segmentDistanceMeters;
            descentGradeSum += gradePct;
            descentSegments++;
          } else {
            flatDistance += segmentDistanceMeters;
          }
        }
      }

      prevLat = lat;
      prevLon = lon;
      prevElevationForGrade = elevationFt;
    }

    // Calculate course profile percentages
    const totalDistanceMeters = climbingDistance + flatDistance + descentDistance;
    const courseProfile: CourseProfileResult = {
      climbingPct: totalDistanceMeters > 0 ? Math.round((climbingDistance / totalDistanceMeters) * 100) : 0,
      flatPct: totalDistanceMeters > 0 ? Math.round((flatDistance / totalDistanceMeters) * 100) : 0,
      descentPct: totalDistanceMeters > 0 ? Math.round((descentDistance / totalDistanceMeters) * 100) : 0,
      avgClimbGrade: climbingSegments > 0 ? Math.round((climbingGradeSum / climbingSegments) * 10) / 10 : 0,
      avgDescentGrade: descentSegments > 0 ? Math.round((descentGradeSum / descentSegments) * 10) / 10 : 0,
    };

    return {
      totalDistanceMiles: Math.round(totalDistance * 10) / 10,
      elevationGain: Math.round(totalGain),
      elevationLoss: Math.round(totalLoss),
      elevationHigh: Math.round(maxElev),
      elevationLow: Math.round(minElev),
      courseProfile,
    };
  } catch (err) {
    console.error("Error parsing GPX:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

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

    // Sanitize filename - remove special characters that could cause storage issues
    const sanitizedFileName = file.name
      .replace(/[|®©™]/g, "") // Remove pipe and special symbols
      .replace(/[^\w\s.-]/g, "") // Remove other non-word chars except spaces, dots, hyphens
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase();

    // Create a unique file path
    const filePath = `${raceSlug}/${year}/${Date.now()}-${sanitizedFileName}`;

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
        // Course profile data from GPX analysis
        updateData.climbing_pct = gpxStats.courseProfile.climbingPct;
        updateData.flat_pct = gpxStats.courseProfile.flatPct;
        updateData.descent_pct = gpxStats.courseProfile.descentPct;
        updateData.avg_climb_grade = gpxStats.courseProfile.avgClimbGrade;
        updateData.avg_descent_grade = gpxStats.courseProfile.avgDescentGrade;
        updateData.total_elevation_loss = gpxStats.elevationLoss;
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
