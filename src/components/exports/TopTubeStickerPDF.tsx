"use client";

import { Document, Page, View, Text, StyleSheet, Svg, Path, Rect } from "@react-pdf/renderer";

// Vertical top tube sticker dimensions (in points, 72 points = 1 inch)
// Standard: 1.5" x 9" = 108 x 648 points
// Compact: 1.25" x 7" = 90 x 504 points
// Extended: 1.75" x 11" = 126 x 792 points

const SIZES = {
  compact: { width: 90, height: 504 },
  standard: { width: 108, height: 648 },
  extended: { width: 126, height: 792 },
};

// Brand colors
const COLORS = {
  navy900: "#102a43",
  navy800: "#243b53",
  navy700: "#334e68",
  navy600: "#486581",
  navy500: "#627d98",
  navy400: "#829ab1",
  navy300: "#9fb3c8",
  navy200: "#bcccdc",
  navy100: "#d9e2ec",
  navy50: "#f0f4f8",
  sky500: "#0ea5e9",
  sky400: "#38bdf8",
  sky300: "#7dd3fc",
  sky200: "#bae6fd",
  sky100: "#e0f2fe",
  white: "#ffffff",
  green500: "#22c55e",
  orange500: "#f97316",
  red500: "#ef4444",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.white,
    fontFamily: "Helvetica",
  },
  container: {
    flex: 1,
    padding: 6,
  },
  // Header section
  header: {
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.navy900,
    marginBottom: 4,
  },
  raceName: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy900,
    textAlign: "center",
    marginBottom: 1,
  },
  raceDate: {
    fontSize: 5,
    color: COLORS.navy600,
    textAlign: "center",
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 2,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy900,
  },
  statLabel: {
    fontSize: 4,
    color: COLORS.navy500,
    textTransform: "uppercase",
  },
  // Main elevation section
  elevationContainer: {
    flex: 1,
    marginVertical: 4,
  },
  // Checkpoint row
  checkpointRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.navy200,
  },
  checkpointRowAlt: {
    backgroundColor: COLORS.navy50,
  },
  checkpointMile: {
    width: 18,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: COLORS.sky500,
    textAlign: "right",
    paddingRight: 3,
  },
  checkpointName: {
    flex: 1,
    fontSize: 5,
    color: COLORS.navy800,
    paddingLeft: 2,
  },
  checkpointTime: {
    width: 26,
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy900,
    textAlign: "right",
  },
  // Footer
  footer: {
    paddingTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.navy900,
    marginTop: 4,
  },
  finishRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  finishLabel: {
    fontSize: 5,
    color: COLORS.navy600,
  },
  finishTime: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.green500,
  },
  logo: {
    fontSize: 5,
    color: COLORS.navy400,
    textAlign: "center",
  },
  motivationalText: {
    fontSize: 4,
    color: COLORS.navy400,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 1,
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

// Generate SVG path for elevation profile
function generateElevationPath(
  elevationData: ElevationDataPoint[],
  chartWidth: number,
  chartHeight: number,
  padding: number = 2
): { path: string; minElev: number; maxElev: number } {
  if (elevationData.length < 2) {
    return { path: "", minElev: 0, maxElev: 1000 };
  }

  const maxMile = Math.max(...elevationData.map(p => p.mile));
  const minElev = Math.min(...elevationData.map(p => p.elevation));
  const maxElev = Math.max(...elevationData.map(p => p.elevation));
  const elevRange = maxElev - minElev || 1;

  const effectiveWidth = chartWidth - padding * 2;
  const effectiveHeight = chartHeight - padding * 2;

  // Build the path - elevation goes top to bottom (y increases downward in PDF)
  const points = elevationData.map(point => {
    const x = padding + (point.mile / maxMile) * effectiveWidth;
    const y = padding + effectiveHeight - ((point.elevation - minElev) / elevRange) * effectiveHeight;
    return { x, y };
  });

  // Create filled area path
  let path = `M ${padding} ${padding + effectiveHeight}`; // Start at bottom-left
  points.forEach(p => {
    path += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  });
  path += ` L ${padding + effectiveWidth} ${padding + effectiveHeight}`; // Bottom-right
  path += " Z"; // Close path

  return { path, minElev, maxElev };
}

// Compact elevation mini-chart for header
function ElevationMiniChart({
  elevationData,
  width,
  height
}: {
  elevationData: ElevationDataPoint[];
  width: number;
  height: number;
}) {
  const { path } = generateElevationPath(elevationData, width, height, 1);

  if (!path) return null;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={0} width={width} height={height} fill={COLORS.navy100} />
      <Path d={path} fill={COLORS.sky300} stroke={COLORS.sky500} strokeWidth={0.5} />
    </Svg>
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
  const dimensions = SIZES[size];
  const fontScale = size === "compact" ? 0.85 : size === "extended" ? 1.1 : 1;

  // Calculate mini chart dimensions
  const miniChartWidth = dimensions.width - 16;
  const miniChartHeight = 16 * fontScale;

  return (
    <Document>
      <Page size={[dimensions.width, dimensions.height]} style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.raceName, { fontSize: 7 * fontScale }]}>
              {raceName}
            </Text>
            {raceDate && (
              <Text style={[styles.raceDate, { fontSize: 5 * fontScale }]}>
                {raceDate}
              </Text>
            )}

            {/* Mini elevation profile */}
            {elevationData.length > 0 && (
              <View style={{ alignItems: "center", marginVertical: 3 }}>
                <ElevationMiniChart
                  elevationData={elevationData}
                  width={miniChartWidth}
                  height={miniChartHeight}
                />
              </View>
            )}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { fontSize: 6 * fontScale }]}>
                  {totalDistance.toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { fontSize: 4 * fontScale }]}>MI</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { fontSize: 6 * fontScale }]}>
                  {totalElevationGain.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { fontSize: 4 * fontScale }]}>FT ↑</Text>
              </View>
              {goalTime && (
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { fontSize: 6 * fontScale, color: COLORS.sky500 }]}>
                    {goalTime}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: 4 * fontScale }]}>GOAL</Text>
                </View>
              )}
            </View>
          </View>

          {/* Column Headers */}
          <View style={{ flexDirection: "row", paddingVertical: 2, marginBottom: 1 }}>
            <Text style={{ width: 18, fontSize: 4 * fontScale, color: COLORS.navy400, textAlign: "right", paddingRight: 3 }}>MI</Text>
            <Text style={{ flex: 1, fontSize: 4 * fontScale, color: COLORS.navy400, paddingLeft: 2 }}>CHECKPOINT</Text>
            <Text style={{ width: 26, fontSize: 4 * fontScale, color: COLORS.navy400, textAlign: "right" }}>ETA</Text>
          </View>

          {/* Checkpoints List */}
          <View style={styles.elevationContainer}>
            {checkpoints.map((checkpoint, index) => {
              const isAlt = index % 2 === 1;
              const isFinish = checkpoint.type === "finish" || index === checkpoints.length - 1;

              return (
                <View
                  key={index}
                  style={[
                    styles.checkpointRow,
                    isAlt ? styles.checkpointRowAlt : {},
                    isFinish ? { borderBottomWidth: 1.5, borderBottomColor: COLORS.navy900 } : {},
                  ]}
                >
                  <Text style={[styles.checkpointMile, { fontSize: 6 * fontScale }]}>
                    {checkpoint.mile.toFixed(1)}
                  </Text>
                  <Text
                    style={[
                      styles.checkpointName,
                      { fontSize: 5 * fontScale },
                      isFinish ? { fontFamily: "Helvetica-Bold" } : {},
                    ]}
                  >
                    {checkpoint.name}
                  </Text>
                  <Text
                    style={[
                      styles.checkpointTime,
                      { fontSize: 5 * fontScale },
                      isFinish ? { color: COLORS.green500 } : {},
                    ]}
                  >
                    {checkpoint.arrivalTime}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {checkpoints.length > 0 && (
              <View style={styles.finishRow}>
                <Text style={[styles.finishLabel, { fontSize: 5 * fontScale }]}>FINISH</Text>
                <Text style={[styles.finishTime, { fontSize: 8 * fontScale }]}>
                  {checkpoints[checkpoints.length - 1]?.arrivalTime}
                </Text>
              </View>
            )}
            <Text style={[styles.logo, { fontSize: 5 * fontScale }]}>
              FinalClimb.com
            </Text>
            <Text style={[styles.motivationalText, { fontSize: 4 * fontScale }]}>
              Trust the plan. Finish strong.
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
