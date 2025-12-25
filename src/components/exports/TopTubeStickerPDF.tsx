"use client";

import React from "react";
import { Document, Page, View, Text, StyleSheet, Svg, Path, Rect, Circle, Line } from "@react-pdf/renderer";

// Vertical top tube sticker dimensions
const SIZES = {
  compact: { width: 108, height: 504 },   // 1.5" x 7"
  standard: { width: 126, height: 648 },  // 1.75" x 9"
  extended: { width: 144, height: 792 },  // 2" x 11"
};

// Brand colors - vibrant for visibility while riding
const COLORS = {
  navy900: "#102a43",
  navy800: "#243b53",
  navy700: "#334e68",
  navy600: "#486581",
  navy500: "#627d98",
  navy300: "#9fb3c8",
  navy200: "#bcccdc",
  navy100: "#d9e2ec",
  sky600: "#0284c7",
  sky500: "#0ea5e9",
  sky400: "#38bdf8",
  sky300: "#7dd3fc",
  sky200: "#bae6fd",
  sky100: "#e0f2fe",
  white: "#ffffff",
  green500: "#22c55e",
  green600: "#16a34a",
  orange500: "#f97316",
  orange600: "#ea580c",
  yellow400: "#facc15",
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
  const fontScale = size === "compact" ? 0.9 : size === "extended" ? 1.15 : 1;

  // Layout - maximize profile width
  const headerHeight = 52 * fontScale;
  const footerHeight = 36 * fontScale;
  const sidePadding = 3;

  const profileTop = headerHeight;
  const profileBottom = dim.height - footerHeight;
  const profileHeight = profileBottom - profileTop;

  // Profile uses most of width - labels overlay on right portion
  const mileColumnWidth = 12;
  const profileLeft = sidePadding + mileColumnWidth;
  const profileRight = dim.width - sidePadding;
  const profileWidth = profileRight - profileLeft;

  // Elevation calculations
  const minElev = elevationData.length > 0 ? Math.min(...elevationData.map(p => p.elevation)) : 0;
  const maxElev = elevationData.length > 0 ? Math.max(...elevationData.map(p => p.elevation)) : 10000;
  const elevRange = maxElev - minElev || 1;

  // Converters
  const mileToY = (mile: number) => profileTop + (mile / totalDistance) * profileHeight;
  const elevToX = (elev: number) => {
    const normalized = (elev - minElev) / elevRange;
    // Profile fills from left edge, higher elevation = more to the right
    return profileLeft + normalized * profileWidth * 0.85; // Leave 15% for labels
  };

  // Generate profile path
  const generateProfilePath = () => {
    if (elevationData.length < 2) {
      // Fallback: simple rectangle if no elevation data
      return `M ${profileLeft} ${profileTop} L ${profileLeft + profileWidth * 0.5} ${profileTop} L ${profileLeft + profileWidth * 0.5} ${profileBottom} L ${profileLeft} ${profileBottom} Z`;
    }

    let path = `M ${profileLeft} ${profileTop}`;
    elevationData.forEach(point => {
      const y = mileToY(point.mile);
      const x = elevToX(point.elevation);
      path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    path += ` L ${profileLeft} ${profileBottom} Z`;
    return path;
  };

  // Mile markers
  const getMileMarkers = () => {
    const markers = [];
    const interval = totalDistance <= 30 ? 5 : totalDistance <= 60 ? 10 : totalDistance <= 120 ? 20 : 25;
    for (let mile = 0; mile <= totalDistance; mile += interval) {
      markers.push({ mile, y: mileToY(mile) });
    }
    // Always include finish
    if (markers[markers.length - 1]?.mile !== Math.floor(totalDistance)) {
      markers.push({ mile: Math.floor(totalDistance), y: mileToY(totalDistance) });
    }
    return markers;
  };

  const profilePath = generateProfilePath();
  const mileMarkers = getMileMarkers();

  // Truncate checkpoint names smartly
  const truncateName = (name: string, maxLen: number) => {
    if (name.length <= maxLen) return name;
    return name.slice(0, maxLen - 1) + "…";
  };

  return (
    <Document>
      <Page size={[dim.width, dim.height]} style={styles.page}>
        <Svg width={dim.width} height={dim.height} viewBox={`0 0 ${dim.width} ${dim.height}`}>
          {/* White background */}
          <Rect x={0} y={0} width={dim.width} height={dim.height} fill={COLORS.white} />

          {/* Header - dark navy gradient effect */}
          <Rect x={0} y={0} width={dim.width} height={headerHeight} fill={COLORS.navy900} />
          <Rect x={0} y={headerHeight - 3} width={dim.width} height={3} fill={COLORS.sky500} />

          {/* Profile background - light blue */}
          <Rect x={profileLeft} y={profileTop} width={profileWidth} height={profileHeight} fill={COLORS.sky100} />

          {/* Mile grid lines */}
          {mileMarkers.map((m, i) => (
            <Line
              key={`grid-${i}`}
              x1={profileLeft}
              y1={m.y}
              x2={profileRight}
              y2={m.y}
              stroke={COLORS.navy200}
              strokeWidth={0.5}
              strokeDasharray="2,2"
            />
          ))}

          {/* Elevation profile - gradient fill effect */}
          <Path d={profilePath} fill={COLORS.sky300} />
          <Path d={profilePath} fill="none" stroke={COLORS.sky500} strokeWidth={1.5} />

          {/* Checkpoint markers and connector lines */}
          {checkpoints.map((cp, i) => {
            const y = mileToY(cp.mile);
            const isFinish = cp.type === "finish" || i === checkpoints.length - 1;
            const markerX = profileRight - 28;

            return (
              <React.Fragment key={`cp-${i}`}>
                {/* Connector line from profile to marker */}
                <Line
                  x1={elevToX(elevationData.find(p => Math.abs(p.mile - cp.mile) < 1)?.elevation || maxElev * 0.5)}
                  y1={y}
                  x2={markerX - 5}
                  y2={y}
                  stroke={isFinish ? COLORS.green500 : COLORS.orange500}
                  strokeWidth={1}
                  strokeDasharray={isFinish ? "0" : "1,1"}
                />
                {/* Marker circle */}
                <Circle
                  cx={markerX}
                  cy={y}
                  r={5}
                  fill={isFinish ? COLORS.green500 : COLORS.orange500}
                  stroke={COLORS.white}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            );
          })}

          {/* Footer background */}
          <Rect x={0} y={dim.height - footerHeight} width={dim.width} height={footerHeight} fill={COLORS.navy900} />
          <Rect x={0} y={dim.height - footerHeight} width={dim.width} height={2} fill={COLORS.sky500} />
        </Svg>

        {/* Text overlay */}
        <View style={{ position: "absolute", top: 0, left: 0, width: dim.width, height: dim.height }}>
          {/* Header */}
          <View style={{ height: headerHeight, paddingHorizontal: 6, paddingTop: 6, paddingBottom: 4 }}>
            <Text style={{
              fontSize: 9 * fontScale,
              fontFamily: "Helvetica-Bold",
              color: COLORS.white,
              textAlign: "center",
            }}>
              {raceName}
            </Text>
            {raceDate && (
              <Text style={{
                fontSize: 6 * fontScale,
                color: COLORS.sky300,
                textAlign: "center",
                marginTop: 1,
              }}>
                {raceDate}
              </Text>
            )}
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 3 }}>
              <Text style={{ fontSize: 7 * fontScale, fontFamily: "Helvetica-Bold", color: COLORS.sky400 }}>
                {totalDistance.toFixed(0)} mi
              </Text>
              <Text style={{ fontSize: 7 * fontScale, color: COLORS.sky300, marginHorizontal: 4 }}>•</Text>
              <Text style={{ fontSize: 7 * fontScale, fontFamily: "Helvetica-Bold", color: COLORS.sky400 }}>
                {totalElevationGain.toLocaleString()}′ ↑
              </Text>
            </View>
          </View>

          {/* Mile labels on left */}
          {mileMarkers.map((m, i) => (
            <View
              key={`mile-${i}`}
              style={{
                position: "absolute",
                top: m.y - 4,
                left: sidePadding,
                width: mileColumnWidth - 2,
              }}
            >
              <Text style={{
                fontSize: 6 * fontScale,
                fontFamily: "Helvetica-Bold",
                color: COLORS.navy600,
                textAlign: "right",
              }}>
                {m.mile}
              </Text>
            </View>
          ))}

          {/* Checkpoint labels - positioned to right of markers */}
          {checkpoints.map((cp, i) => {
            const y = mileToY(cp.mile);
            const isFinish = cp.type === "finish" || i === checkpoints.length - 1;
            const labelLeft = profileRight - 24;

            return (
              <View
                key={`label-${i}`}
                style={{
                  position: "absolute",
                  top: y - 12,
                  left: labelLeft,
                  width: 22,
                  alignItems: "flex-end",
                }}
              >
                <Text style={{
                  fontSize: 7 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: isFinish ? COLORS.green600 : COLORS.sky600,
                }}>
                  {cp.mile.toFixed(1)}
                </Text>
                <Text style={{
                  fontSize: 5 * fontScale,
                  color: COLORS.navy700,
                  textAlign: "right",
                }}>
                  {truncateName(cp.name, 8)}
                </Text>
                <Text style={{
                  fontSize: 6.5 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: isFinish ? COLORS.green600 : COLORS.navy900,
                }}>
                  {cp.arrivalTime}
                </Text>
              </View>
            );
          })}

          {/* Footer with branding */}
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: dim.width,
            height: footerHeight,
            paddingHorizontal: 6,
            paddingVertical: 4,
            justifyContent: "center",
          }}>
            {/* Goal time - prominent */}
            {goalTime && (
              <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 6 * fontScale, color: COLORS.sky300 }}>GOAL </Text>
                <Text style={{
                  fontSize: 10 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.green500,
                }}>
                  {goalTime}
                </Text>
              </View>
            )}
            {/* FinalClimb branding - prominent */}
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
              <Text style={{
                fontSize: 8 * fontScale,
                fontFamily: "Helvetica-Bold",
                color: COLORS.sky400,
                letterSpacing: 0.5,
              }}>
                FINAL
              </Text>
              <Text style={{
                fontSize: 8 * fontScale,
                fontFamily: "Helvetica-Bold",
                color: COLORS.white,
                letterSpacing: 0.5,
              }}>
                CLIMB
              </Text>
            </View>
            <Text style={{
              fontSize: 5 * fontScale,
              color: COLORS.navy500,
              textAlign: "center",
              marginTop: 1,
            }}>
              finalclimb.com
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Legacy export
export interface StickerSegment {
  name: string;
  mile: number;
  splitTime: string;
  arrivalTime: string;
}
