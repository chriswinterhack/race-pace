"use client";

import React from "react";
import { Document, Page, View, Text, StyleSheet, Svg, Path, Rect, Circle, Line, G } from "@react-pdf/renderer";

// Vertical top tube sticker dimensions - wider for better readability
const SIZES = {
  compact: { width: 126, height: 504 },   // 1.75" x 7"
  standard: { width: 144, height: 648 },  // 2" x 9"
  extended: { width: 162, height: 792 },  // 2.25" x 11"
};

// Brand colors
const COLORS = {
  navy900: "#102a43",
  navy700: "#334e68",
  navy600: "#486581",
  navy500: "#627d98",
  navy400: "#829ab1",
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

// Mountain icon as SVG path (simple peak design)
function MountainIcon({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  // Mountain shape: two peaks
  const scale = size / 24;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Main peak */}
      <Path
        d="M12 2 L22 20 L2 20 Z"
        fill={color}
      />
      {/* Snow cap */}
      <Path
        d="M12 2 L15 8 L12 6 L9 8 Z"
        fill={COLORS.white}
      />
    </G>
  );
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
  const fontScale = size === "compact" ? 0.9 : size === "extended" ? 1.1 : 1;

  // Layout
  const headerHeight = 58 * fontScale;
  const footerHeight = 44 * fontScale;
  const sidePadding = 4;

  const profileTop = headerHeight;
  const profileBottom = dim.height - footerHeight;
  const profileHeight = profileBottom - profileTop;

  // Profile layout - left side for profile, right side for labels
  const mileColumnWidth = 14;
  const labelColumnWidth = 42;
  const profileLeft = sidePadding + mileColumnWidth;
  const profileRight = dim.width - sidePadding - labelColumnWidth;
  const profileWidth = profileRight - profileLeft;

  // Elevation calculations
  const minElev = elevationData.length > 0 ? Math.min(...elevationData.map(p => p.elevation)) : 0;
  const maxElev = elevationData.length > 0 ? Math.max(...elevationData.map(p => p.elevation)) : 10000;
  const elevRange = maxElev - minElev || 1;

  // Converters
  const mileToY = (mile: number) => profileTop + (mile / totalDistance) * profileHeight;
  const elevToX = (elev: number) => {
    const normalized = (elev - minElev) / elevRange;
    return profileLeft + normalized * profileWidth;
  };

  // Generate profile path
  const generateProfilePath = () => {
    if (elevationData.length < 2) {
      return `M ${profileLeft} ${profileTop} L ${profileLeft + profileWidth * 0.6} ${profileTop} L ${profileLeft + profileWidth * 0.6} ${profileBottom} L ${profileLeft} ${profileBottom} Z`;
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

  // Mile markers - smart intervals
  const getMileMarkers = () => {
    const markers = [];
    const interval = totalDistance <= 30 ? 5 : totalDistance <= 60 ? 10 : 20;
    for (let mile = 0; mile <= totalDistance; mile += interval) {
      markers.push({ mile, y: mileToY(mile) });
    }
    return markers;
  };

  const profilePath = generateProfilePath();
  const mileMarkers = getMileMarkers();

  // Format elevation with proper comma
  const formatElevation = (elev: number) => {
    return Math.round(elev).toLocaleString();
  };

  return (
    <Document>
      <Page size={[dim.width, dim.height]} style={styles.page}>
        <Svg width={dim.width} height={dim.height} viewBox={`0 0 ${dim.width} ${dim.height}`}>
          {/* White background */}
          <Rect x={0} y={0} width={dim.width} height={dim.height} fill={COLORS.white} />

          {/* Header background */}
          <Rect x={0} y={0} width={dim.width} height={headerHeight} fill={COLORS.navy900} />
          <Rect x={0} y={headerHeight - 2} width={dim.width} height={2} fill={COLORS.sky500} />

          {/* Profile area background */}
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
            />
          ))}

          {/* Elevation profile */}
          <Path d={profilePath} fill={COLORS.sky300} />
          <Path d={profilePath} fill="none" stroke={COLORS.sky500} strokeWidth={1.5} />

          {/* Checkpoint markers */}
          {checkpoints.map((cp, i) => {
            const y = mileToY(cp.mile);
            const isFinish = cp.type === "finish" || i === checkpoints.length - 1;
            const markerX = profileRight + 4;

            // Find elevation at this checkpoint
            const cpElev = elevationData.find(p => Math.abs(p.mile - cp.mile) < 1)?.elevation;
            const profileX = cpElev ? elevToX(cpElev) : profileLeft + profileWidth * 0.5;

            return (
              <React.Fragment key={`cp-${i}`}>
                {/* Horizontal line from profile to label area */}
                {isFinish ? (
                  <Line
                    x1={profileX}
                    y1={y}
                    x2={markerX + 2}
                    y2={y}
                    stroke={COLORS.green500}
                    strokeWidth={1.5}
                  />
                ) : (
                  <Line
                    x1={profileX}
                    y1={y}
                    x2={markerX + 2}
                    y2={y}
                    stroke={COLORS.orange500}
                    strokeWidth={1}
                    strokeDasharray="3,2"
                  />
                )}
                {/* Marker dot */}
                <Circle
                  cx={markerX}
                  cy={y}
                  r={4}
                  fill={isFinish ? COLORS.green500 : COLORS.orange500}
                  stroke={COLORS.white}
                  strokeWidth={1}
                />
              </React.Fragment>
            );
          })}

          {/* Footer background */}
          <Rect x={0} y={dim.height - footerHeight} width={dim.width} height={footerHeight} fill={COLORS.navy900} />
          <Rect x={0} y={dim.height - footerHeight} width={dim.width} height={2} fill={COLORS.sky500} />

          {/* Mountain icon in footer */}
          <MountainIcon
            x={dim.width / 2 - 30}
            y={dim.height - 22}
            size={12}
            color={COLORS.sky400}
          />
        </Svg>

        {/* Text overlay */}
        <View style={{ position: "absolute", top: 0, left: 0, width: dim.width, height: dim.height }}>
          {/* Header */}
          <View style={{ height: headerHeight, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 4 }}>
            <Text style={{
              fontSize: 10 * fontScale,
              fontFamily: "Helvetica-Bold",
              color: COLORS.white,
              textAlign: "center",
              marginBottom: 2,
            }}>
              {raceName}
            </Text>
            {raceDate && (
              <Text style={{
                fontSize: 7 * fontScale,
                color: COLORS.sky300,
                textAlign: "center",
                marginBottom: 4,
              }}>
                {raceDate}
              </Text>
            )}
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 8 * fontScale, fontFamily: "Helvetica-Bold", color: COLORS.sky400 }}>
                {totalDistance.toFixed(0)} mi
              </Text>
              <Text style={{ fontSize: 8 * fontScale, color: COLORS.sky300, marginHorizontal: 6 }}>•</Text>
              <Text style={{ fontSize: 8 * fontScale, fontFamily: "Helvetica-Bold", color: COLORS.sky400 }}>
                +{formatElevation(totalElevationGain)} ft
              </Text>
            </View>
          </View>

          {/* Mile labels on left */}
          {mileMarkers.map((m, i) => (
            <View
              key={`mile-${i}`}
              style={{
                position: "absolute",
                top: m.y - 5,
                left: sidePadding,
                width: mileColumnWidth - 2,
              }}
            >
              <Text style={{
                fontSize: 7 * fontScale,
                fontFamily: "Helvetica-Bold",
                color: COLORS.navy500,
                textAlign: "right",
              }}>
                {m.mile}
              </Text>
            </View>
          ))}

          {/* Checkpoint labels on right */}
          {checkpoints.map((cp, i) => {
            const y = mileToY(cp.mile);
            const isFinish = cp.type === "finish" || i === checkpoints.length - 1;
            const labelLeft = profileRight + 10;

            return (
              <View
                key={`label-${i}`}
                style={{
                  position: "absolute",
                  top: y - 14,
                  left: labelLeft,
                  width: labelColumnWidth - 6,
                }}
              >
                {/* Mile number */}
                <Text style={{
                  fontSize: 9 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: isFinish ? COLORS.green600 : COLORS.sky600,
                }}>
                  {cp.mile.toFixed(1)}
                </Text>
                {/* Checkpoint name - truncate smartly */}
                <Text style={{
                  fontSize: 6 * fontScale,
                  color: COLORS.navy600,
                  marginTop: 1,
                }}>
                  {cp.name.length > 10 ? cp.name.slice(0, 9) + "…" : cp.name}
                </Text>
                {/* Arrival time - single line */}
                <Text style={{
                  fontSize: 8 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: isFinish ? COLORS.green600 : COLORS.navy900,
                  marginTop: 1,
                }}>
                  {cp.arrivalTime}
                </Text>
              </View>
            );
          })}

          {/* Footer */}
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: dim.width,
            height: footerHeight,
            paddingHorizontal: 8,
            paddingVertical: 6,
            justifyContent: "center",
          }}>
            {/* Goal time */}
            {goalTime && (
              <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 7 * fontScale, color: COLORS.sky300, marginRight: 4 }}>GOAL</Text>
                <Text style={{
                  fontSize: 11 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.green500,
                }}>
                  {goalTime}
                </Text>
              </View>
            )}
            {/* FinalClimb branding with mountain icon space */}
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
              <Text style={{
                fontSize: 9 * fontScale,
                fontFamily: "Helvetica-Bold",
                color: COLORS.sky400,
              }}>
                FINAL
              </Text>
              <View style={{ width: 14, height: 10 }} />
              <Text style={{
                fontSize: 9 * fontScale,
                fontFamily: "Helvetica-Bold",
                color: COLORS.white,
              }}>
                CLIMB
              </Text>
            </View>
            <Text style={{
              fontSize: 6 * fontScale,
              color: COLORS.navy400,
              textAlign: "center",
              marginTop: 2,
            }}>
              finalclimbapp.com
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
