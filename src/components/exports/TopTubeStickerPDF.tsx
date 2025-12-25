"use client";

import { Document, Page, View, Text, StyleSheet, Svg, Path, Rect, Circle, Line } from "@react-pdf/renderer";

// Vertical top tube sticker - elevation profile runs top to bottom
// Standard: 1.5" x 9" = 108 x 648 points
const SIZES = {
  compact: { width: 90, height: 504 },
  standard: { width: 108, height: 648 },
  extended: { width: 126, height: 792 },
};

// Brand colors
const COLORS = {
  navy900: "#102a43",
  navy700: "#334e68",
  navy500: "#627d98",
  navy400: "#829ab1",
  navy200: "#bcccdc",
  navy100: "#d9e2ec",
  navy50: "#f0f4f8",
  sky500: "#0ea5e9",
  sky400: "#38bdf8",
  sky300: "#7dd3fc",
  sky200: "#bae6fd",
  white: "#ffffff",
  green500: "#22c55e",
  orange500: "#f97316",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.white,
    fontFamily: "Helvetica",
  },
});

export interface ElevationDataPoint {
  mile: number;
  elevation: number;
}

export interface StickerCheckpoint {
  name: string;
  mile: number;
  arrivalTime: string;
  type?: "aid_station" | "checkpoint" | "start" | "finish";
}

export interface TopTubeStickerProps {
  raceName: string;
  raceDate?: string;
  totalDistance: number;
  totalElevationGain: number;
  goalTime?: string;
  checkpoints: StickerCheckpoint[];
  elevationData?: ElevationDataPoint[];
  size?: "standard" | "compact" | "extended";
}

export function TopTubeStickerPDF({
  raceName,
  raceDate,
  totalDistance,
  totalElevationGain,
  goalTime,
  checkpoints,
  elevationData = [],
  size = "standard",
}: TopTubeStickerProps) {
  const dim = SIZES[size];
  const fontScale = size === "compact" ? 0.85 : size === "extended" ? 1.1 : 1;

  // Layout constants
  const headerHeight = 45 * fontScale;
  const footerHeight = 25 * fontScale;
  const padding = 4;

  // Profile area dimensions
  const profileTop = headerHeight;
  const profileBottom = dim.height - footerHeight;
  const profileHeight = profileBottom - profileTop;

  // Horizontal layout: [elevation scale][profile][checkpoint labels]
  const elevScaleWidth = 14;
  const profileWidth = 28;
  const labelAreaWidth = dim.width - elevScaleWidth - profileWidth - padding * 2;

  const profileLeft = padding + elevScaleWidth;
  const profileRight = profileLeft + profileWidth;

  // Calculate elevation bounds
  const minElev = elevationData.length > 0
    ? Math.min(...elevationData.map(p => p.elevation))
    : 0;
  const maxElev = elevationData.length > 0
    ? Math.max(...elevationData.map(p => p.elevation))
    : 10000;
  const elevRange = maxElev - minElev || 1;

  // Helper: convert mile to Y position (0 = top, totalDistance = bottom)
  const mileToY = (mile: number) => {
    return profileTop + (mile / totalDistance) * profileHeight;
  };

  // Helper: convert elevation to X position within profile
  const elevToX = (elev: number) => {
    const normalized = (elev - minElev) / elevRange;
    return profileLeft + normalized * profileWidth;
  };

  // Generate elevation profile path (top to bottom = start to finish)
  const generateProfilePath = () => {
    if (elevationData.length < 2) return "";

    // Start at top-left of profile area
    let path = `M ${profileLeft} ${profileTop}`;

    // Draw elevation line from top to bottom
    elevationData.forEach(point => {
      const y = mileToY(point.mile);
      const x = elevToX(point.elevation);
      path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    // Close the shape: go to bottom-left corner, then back up
    path += ` L ${profileLeft} ${profileBottom}`;
    path += " Z";

    return path;
  };

  // Generate mile markers along the profile
  const mileMarkers = () => {
    const markers = [];
    const interval = totalDistance <= 50 ? 10 : totalDistance <= 100 ? 20 : 25;
    for (let mile = 0; mile <= totalDistance; mile += interval) {
      markers.push({
        mile,
        y: mileToY(mile),
      });
    }
    return markers;
  };

  const profilePath = generateProfilePath();
  const mileMarkerList = mileMarkers();

  return (
    <Document>
      <Page size={[dim.width, dim.height]} style={styles.page}>
        {/* Full-page SVG for the elevation profile layout */}
        <Svg width={dim.width} height={dim.height} viewBox={`0 0 ${dim.width} ${dim.height}`}>
          {/* Background */}
          <Rect x={0} y={0} width={dim.width} height={dim.height} fill={COLORS.white} />

          {/* Header background */}
          <Rect x={0} y={0} width={dim.width} height={headerHeight} fill={COLORS.navy900} />

          {/* Profile background */}
          <Rect
            x={profileLeft - 1}
            y={profileTop}
            width={profileWidth + 2}
            height={profileHeight}
            fill={COLORS.sky200}
          />

          {/* Elevation profile fill */}
          {profilePath && (
            <Path d={profilePath} fill={COLORS.sky400} stroke={COLORS.sky500} strokeWidth={0.5} />
          )}

          {/* Mile grid lines */}
          {mileMarkerList.map((marker, i) => (
            <Line
              key={`mile-${i}`}
              x1={profileLeft - 2}
              y1={marker.y}
              x2={profileRight + 2}
              y2={marker.y}
              stroke={COLORS.navy200}
              strokeWidth={0.5}
            />
          ))}

          {/* Checkpoint markers on the profile */}
          {checkpoints.map((cp, i) => {
            const y = mileToY(cp.mile);
            const isFinish = cp.type === "finish" || i === checkpoints.length - 1;
            const markerColor = isFinish ? COLORS.green500 : COLORS.orange500;

            return (
              <Circle
                key={`cp-marker-${i}`}
                cx={profileRight - 2}
                cy={y}
                r={3}
                fill={markerColor}
                stroke={COLORS.white}
                strokeWidth={0.5}
              />
            );
          })}

          {/* Footer background */}
          <Rect x={0} y={dim.height - footerHeight} width={dim.width} height={footerHeight} fill={COLORS.navy50} />

          {/* Footer separator line */}
          <Line
            x1={0}
            y1={dim.height - footerHeight}
            x2={dim.width}
            y2={dim.height - footerHeight}
            stroke={COLORS.navy900}
            strokeWidth={1}
          />
        </Svg>

        {/* Text overlay using View/Text (positioned absolute) */}
        <View style={{ position: "absolute", top: 0, left: 0, width: dim.width, height: dim.height }}>
          {/* Header content */}
          <View style={{ height: headerHeight, padding: 4, justifyContent: "center" }}>
            <Text style={{
              fontSize: 7 * fontScale,
              fontFamily: "Helvetica-Bold",
              color: COLORS.white,
              textAlign: "center",
              marginBottom: 2,
            }}>
              {raceName}
            </Text>
            {raceDate && (
              <Text style={{
                fontSize: 5 * fontScale,
                color: COLORS.sky300,
                textAlign: "center",
                marginBottom: 2,
              }}>
                {raceDate}
              </Text>
            )}
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
              <Text style={{ fontSize: 5 * fontScale, color: COLORS.sky200 }}>
                {totalDistance.toFixed(0)} mi
              </Text>
              <Text style={{ fontSize: 5 * fontScale, color: COLORS.sky200 }}>
                +{totalElevationGain.toLocaleString()} ft
              </Text>
            </View>
          </View>

          {/* Mile markers on left side */}
          {mileMarkerList.map((marker, i) => (
            <View
              key={`mile-label-${i}`}
              style={{
                position: "absolute",
                top: marker.y - 4,
                left: padding,
                width: elevScaleWidth - 2,
              }}
            >
              <Text style={{
                fontSize: 5 * fontScale,
                color: COLORS.navy500,
                textAlign: "right",
              }}>
                {marker.mile}
              </Text>
            </View>
          ))}

          {/* Checkpoint labels on right side */}
          {checkpoints.map((cp, i) => {
            const y = mileToY(cp.mile);
            const isFinish = cp.type === "finish" || i === checkpoints.length - 1;

            return (
              <View
                key={`cp-label-${i}`}
                style={{
                  position: "absolute",
                  top: y - 6,
                  left: profileRight + 4,
                  width: labelAreaWidth,
                }}
              >
                <Text style={{
                  fontSize: 5 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: isFinish ? COLORS.green500 : COLORS.sky500,
                }}>
                  {cp.mile.toFixed(1)}
                </Text>
                <Text style={{
                  fontSize: 4.5 * fontScale,
                  color: COLORS.navy700,
                  marginTop: 0.5,
                }}>
                  {cp.name.length > 12 ? cp.name.slice(0, 11) + "…" : cp.name}
                </Text>
                <Text style={{
                  fontSize: 5 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: isFinish ? COLORS.green500 : COLORS.navy900,
                  marginTop: 0.5,
                }}>
                  {cp.arrivalTime}
                </Text>
              </View>
            );
          })}

          {/* Footer content */}
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: dim.width,
            height: footerHeight,
            padding: 4,
            justifyContent: "center",
          }}>
            {goalTime && (
              <Text style={{
                fontSize: 6 * fontScale,
                fontFamily: "Helvetica-Bold",
                color: COLORS.green500,
                textAlign: "center",
                marginBottom: 2,
              }}>
                Goal: {goalTime}
              </Text>
            )}
            <Text style={{
              fontSize: 4 * fontScale,
              color: COLORS.navy400,
              textAlign: "center",
            }}>
              FinalClimb.com
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Legacy export for backwards compatibility
export interface StickerSegment {
  name: string;
  mile: number;
  splitTime: string;
  arrivalTime: string;
}
