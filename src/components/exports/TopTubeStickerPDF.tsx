"use client";

import React from "react";
import { Document, Page, View, Text, StyleSheet, Svg, Path, Rect, Circle, Line, Image } from "@react-pdf/renderer";

// Wider stickers for better readability
const SIZES = {
  compact: { width: 144, height: 504 },   // 2" x 7"
  standard: { width: 162, height: 648 },  // 2.25" x 9"
  extended: { width: 180, height: 792 },  // 2.5" x 11"
};

// Brand colors - matching the logo background
const COLORS = {
  navy900: "#102a43",
  navy800: "#1a365d",
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
  totalDistance: number;
  totalElevationGain: number;
  goalTime?: string;
  checkpoints: StickerCheckpoint[];
  elevationData?: ElevationDataPoint[];
  size?: "standard" | "compact" | "extended";
}


export function TopTubeStickerPDF({
  raceName,
  totalDistance,
  totalElevationGain,
  goalTime,
  checkpoints,
  elevationData = [],
  size = "standard",
}: TopTubeStickerProps) {
  const dim = SIZES[size];
  const fontScale = size === "compact" ? 0.9 : size === "extended" ? 1.1 : 1;

  // Separate finish from other checkpoints
  const finishCheckpoint = checkpoints.find(cp => cp.type === "finish") || checkpoints[checkpoints.length - 1];
  const aidStationCheckpoints = checkpoints.filter((cp, i) =>
    cp.type !== "finish" && i !== checkpoints.length - 1
  );

  // Layout - compact header, larger footer for finish + branding
  const headerHeight = 42 * fontScale;
  const footerHeight = 75 * fontScale;
  const sidePadding = 4;

  const profileTop = headerHeight;
  const profileBottom = dim.height - footerHeight;
  const profileHeight = profileBottom - profileTop;

  // Profile takes left 55%, labels on right 45%
  const mileColumnWidth = 16;
  const profileLeft = sidePadding + mileColumnWidth;
  const profileWidth = (dim.width - sidePadding * 2 - mileColumnWidth) * 0.55;
  const profileRight = profileLeft + profileWidth;
  const labelLeft = profileRight + 8;
  const labelWidth = dim.width - labelLeft - sidePadding;

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
      return `M ${profileLeft} ${profileTop} L ${profileLeft + profileWidth * 0.7} ${profileTop} L ${profileLeft + profileWidth * 0.7} ${profileBottom} L ${profileLeft} ${profileBottom} Z`;
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
    const interval = totalDistance <= 30 ? 5 : totalDistance <= 60 ? 10 : 20;
    for (let mile = 0; mile <= totalDistance; mile += interval) {
      markers.push({ mile, y: mileToY(mile) });
    }
    return markers;
  };

  const profilePath = generateProfilePath();
  const mileMarkers = getMileMarkers();

  return (
    <Document>
      <Page size={[dim.width, dim.height]} style={styles.page}>
        <Svg width={dim.width} height={dim.height} viewBox={`0 0 ${dim.width} ${dim.height}`}>
          {/* White background */}
          <Rect x={0} y={0} width={dim.width} height={dim.height} fill={COLORS.white} />

          {/* Header background */}
          <Rect x={0} y={0} width={dim.width} height={headerHeight} fill={COLORS.navy900} />
          <Rect x={0} y={headerHeight - 2} width={dim.width} height={2} fill={COLORS.sky400} />

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

          {/* Checkpoint markers (not finish) - different icons for aid stations vs checkpoints */}
          {aidStationCheckpoints.map((cp, i) => {
            const y = mileToY(cp.mile);
            const cpElev = elevationData.find(p => Math.abs(p.mile - cp.mile) < 1)?.elevation;
            const profileX = cpElev ? elevToX(cpElev) : profileLeft + profileWidth * 0.5;
            const isAidStation = cp.type === "aid_station";
            const iconX = labelLeft - 6;

            return (
              <React.Fragment key={`cp-${i}`}>
                <Line
                  x1={profileX}
                  y1={y}
                  x2={labelLeft - 2}
                  y2={y}
                  stroke={isAidStation ? COLORS.sky500 : COLORS.orange500}
                  strokeWidth={1}
                  strokeDasharray="3,2"
                />
                {isAidStation ? (
                  // Aid station: Cross/plus icon (for supplies/water)
                  <>
                    <Circle
                      cx={iconX}
                      cy={y}
                      r={5}
                      fill={COLORS.sky500}
                    />
                    {/* Horizontal bar of cross */}
                    <Rect
                      x={iconX - 3}
                      y={y - 1}
                      width={6}
                      height={2}
                      fill={COLORS.white}
                    />
                    {/* Vertical bar of cross */}
                    <Rect
                      x={iconX - 1}
                      y={y - 3}
                      width={2}
                      height={6}
                      fill={COLORS.white}
                    />
                  </>
                ) : (
                  // Checkpoint: Flag icon
                  <>
                    <Circle
                      cx={iconX}
                      cy={y}
                      r={5}
                      fill={COLORS.orange500}
                    />
                    {/* Flag pole */}
                    <Rect
                      x={iconX - 2}
                      y={y - 3}
                      width={1}
                      height={6}
                      fill={COLORS.white}
                    />
                    {/* Flag */}
                    <Path
                      d={`M ${iconX - 1} ${y - 3} L ${iconX + 3} ${y - 1} L ${iconX - 1} ${y + 1} Z`}
                      fill={COLORS.white}
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}

          {/* Footer background - dark navy like the logo */}
          <Rect x={0} y={dim.height - footerHeight} width={dim.width} height={footerHeight} fill={COLORS.navy900} />
          <Rect x={0} y={dim.height - footerHeight} width={dim.width} height={2} fill={COLORS.sky400} />

        </Svg>

        {/* Text overlay */}
        <View style={{ position: "absolute", top: 0, left: 0, width: dim.width, height: dim.height }}>
          {/* Header */}
          <View style={{ height: headerHeight, paddingHorizontal: 6, paddingTop: 6, paddingBottom: 4 }}>
            <Text style={{
              fontSize: 10 * fontScale,
              fontFamily: "Helvetica-Bold",
              color: COLORS.white,
              textAlign: "center",
              marginBottom: 3,
            }}>
              {raceName}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 8 * fontScale, fontFamily: "Helvetica-Bold", color: COLORS.sky400 }}>
                {totalDistance.toFixed(0)} mi
              </Text>
              <Text style={{ fontSize: 8 * fontScale, color: COLORS.sky300, marginHorizontal: 6 }}>•</Text>
              <Text style={{ fontSize: 8 * fontScale, fontFamily: "Helvetica-Bold", color: COLORS.sky400 }}>
                +{Math.round(totalElevationGain).toLocaleString()} ft
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

          {/* Aid station checkpoint labels (not finish) */}
          {aidStationCheckpoints.map((cp, i) => {
            const y = mileToY(cp.mile);

            return (
              <View
                key={`label-${i}`}
                style={{
                  position: "absolute",
                  top: y - 18,
                  left: labelLeft,
                  width: labelWidth,
                }}
              >
                <Text style={{
                  fontSize: 11 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.sky600,
                }}>
                  {cp.mile.toFixed(1)}
                </Text>
                <Text style={{
                  fontSize: 6.5 * fontScale,
                  color: COLORS.navy700,
                  marginTop: 1,
                }}>
                  {cp.name}
                </Text>
                <Text style={{
                  fontSize: 9 * fontScale,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.navy900,
                  marginTop: 1,
                }}>
                  {cp.arrivalTime}
                </Text>
              </View>
            );
          })}

          {/* Footer with FINISH info and branding */}
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: dim.width,
            height: footerHeight,
            paddingHorizontal: 6,
            paddingTop: 6,
          }}>
            {/* Finish row - centered finish info with goal time */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green500, marginRight: 4 }} />
                <Text style={{ fontSize: 9 * fontScale, fontFamily: "Helvetica-Bold", color: COLORS.green500 }}>
                  FINISH {finishCheckpoint?.mile.toFixed(1)}
                </Text>
              </View>
              <Text style={{ fontSize: 11 * fontScale, fontFamily: "Helvetica-Bold", color: COLORS.white }}>
                {finishCheckpoint?.arrivalTime}
              </Text>
            </View>

            {/* Goal time row */}
            {goalTime && (
              <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 7 * fontScale, color: COLORS.sky300, marginRight: 6 }}>GOAL</Text>
                <Text style={{ fontSize: 12 * fontScale, fontFamily: "Helvetica-Bold", color: COLORS.green500 }}>
                  {goalTime}
                </Text>
              </View>
            )}

            {/* FinalClimb logo - correct aspect ratio 292:70 (~4.17:1) */}
            <View style={{ alignItems: "center" }}>
              <Image
                src="/images/finalclimb-logo.png"
                style={{ width: 100 * fontScale, height: 24 * fontScale }}
              />
            </View>
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
