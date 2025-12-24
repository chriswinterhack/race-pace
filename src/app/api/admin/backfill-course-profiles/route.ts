import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { DOMParser } from "@xmldom/xmldom";
import { requireAdmin } from "@/lib/auth/admin";
import { haversineDistance } from "@/lib/utils";
import { GRADE_THRESHOLDS } from "@/lib/constants";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CourseProfileResult {
  climbingPct: number;
  flatPct: number;
  descentPct: number;
  avgClimbGrade: number;
  avgDescentGrade: number;
  elevationLoss: number;
}

// Parse GPX and extract course profile
function parseGPXCourseProfile(gpxText: string): CourseProfileResult | null {
  try {
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxText, "text/xml");

    const trackPoints = gpxDoc.getElementsByTagName("trkpt");
    if (trackPoints.length === 0) {
      return null;
    }

    let prevLat: number | null = null;
    let prevLon: number | null = null;
    let prevElevation: number | null = null;
    let totalLoss = 0;

    let climbingDistance = 0;
    let flatDistance = 0;
    let descentDistance = 0;
    let climbingGradeSum = 0;
    let climbingSegments = 0;
    let descentGradeSum = 0;
    let descentSegments = 0;

    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints.item(i);
      if (!point) continue;
      const lat = parseFloat(point.getAttribute("lat") || "0");
      const lon = parseFloat(point.getAttribute("lon") || "0");
      const eleElements = point.getElementsByTagName("ele");
      const firstEle = eleElements.item(0);
      const elevationMeters = firstEle ? parseFloat(firstEle.textContent || "0") : 0;
      const elevationFt = elevationMeters * 3.28084;

      if (prevLat !== null && prevLon !== null && prevElevation !== null) {
        const segmentDistanceKm = haversineDistance(prevLat, prevLon, lat, lon);
        const segmentDistanceMeters = segmentDistanceKm * 1000;

        if (segmentDistanceMeters > 0) {
          const elevDiffFt = elevationFt - prevElevation;
          const elevDiffMeters = elevationMeters - (prevElevation / 3.28084);

          if (elevDiffFt < 0) {
            totalLoss += Math.abs(elevDiffFt);
          }

          const gradePct = (elevDiffMeters / segmentDistanceMeters) * 100;

          if (gradePct >= GRADE_THRESHOLDS.CLIMBING) {
            climbingDistance += segmentDistanceMeters;
            climbingGradeSum += gradePct;
            climbingSegments++;
          } else if (gradePct <= GRADE_THRESHOLDS.FLAT_MIN) {
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
      prevElevation = elevationFt;
    }

    const totalDistanceMeters = climbingDistance + flatDistance + descentDistance;

    return {
      climbingPct: totalDistanceMeters > 0 ? Math.round((climbingDistance / totalDistanceMeters) * 100) : 0,
      flatPct: totalDistanceMeters > 0 ? Math.round((flatDistance / totalDistanceMeters) * 100) : 0,
      descentPct: totalDistanceMeters > 0 ? Math.round((descentDistance / totalDistanceMeters) * 100) : 0,
      avgClimbGrade: climbingSegments > 0 ? Math.round((climbingGradeSum / climbingSegments) * 10) / 10 : 0,
      avgDescentGrade: descentSegments > 0 ? Math.round((descentGradeSum / descentSegments) * 10) / 10 : 0,
      elevationLoss: Math.round(totalLoss),
    };
  } catch (err) {
    console.error("Error parsing GPX:", err);
    return null;
  }
}

export async function POST(_request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    // Get all race_distances with GPX but no course profile
    const { data: distances, error } = await supabaseAdmin
      .from("race_distances")
      .select("id, gpx_file_url, climbing_pct")
      .not("gpx_file_url", "is", null);

    if (error) {
      console.error("Error fetching distances:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter to only those without course profile data
    const needsBackfill = distances?.filter(d => d.climbing_pct === null) || [];

    console.log(`Found ${needsBackfill.length} distances needing course profile backfill`);

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const distance of needsBackfill) {
      try {
        // Fetch GPX file
        const gpxResponse = await fetch(distance.gpx_file_url);
        if (!gpxResponse.ok) {
          results.push({ id: distance.id, success: false, error: "Failed to fetch GPX" });
          continue;
        }

        const gpxText = await gpxResponse.text();
        const profile = parseGPXCourseProfile(gpxText);

        if (!profile) {
          results.push({ id: distance.id, success: false, error: "Failed to parse GPX" });
          continue;
        }

        // Update database
        const { error: updateError } = await supabaseAdmin
          .from("race_distances")
          .update({
            climbing_pct: profile.climbingPct,
            flat_pct: profile.flatPct,
            descent_pct: profile.descentPct,
            avg_climb_grade: profile.avgClimbGrade,
            avg_descent_grade: profile.avgDescentGrade,
            total_elevation_loss: profile.elevationLoss,
          })
          .eq("id", distance.id);

        if (updateError) {
          results.push({ id: distance.id, success: false, error: updateError.message });
        } else {
          results.push({ id: distance.id, success: true });
        }
      } catch (err) {
        results.push({ id: distance.id, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      data: {
        total: needsBackfill.length,
        success: successCount,
        failed: failCount,
        results,
      },
      error: null,
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
