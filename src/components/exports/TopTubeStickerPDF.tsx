"use client";

import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

// Register fonts for better typography
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 8,
    backgroundColor: "#ffffff",
    fontFamily: "Inter",
  },
  // Standard sticker: roughly 2" x 8" (144 x 576 points)
  stickerStandard: {
    width: 576,
    height: 144,
  },
  // Compact sticker: roughly 1.5" x 6" (108 x 432 points)
  stickerCompact: {
    width: 432,
    height: 108,
  },
  // Extended sticker: roughly 2.5" x 10" (180 x 720 points)
  stickerExtended: {
    width: 720,
    height: 180,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "#102a43",
    marginBottom: 6,
  },
  raceName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#102a43",
  },
  raceDate: {
    fontSize: 8,
    color: "#627d98",
  },
  goalTime: {
    fontSize: 10,
    fontWeight: 600,
    color: "#0284c7",
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  splitRowAlt: {
    backgroundColor: "#f8fafc",
  },
  splitRowLast: {
    borderBottomWidth: 2,
    borderBottomColor: "#102a43",
  },
  checkpointName: {
    flex: 3,
    fontSize: 8,
    fontWeight: 600,
    color: "#102a43",
  },
  splitMile: {
    flex: 1,
    fontSize: 8,
    color: "#627d98",
    textAlign: "center",
  },
  splitTime: {
    flex: 1.5,
    fontSize: 9,
    fontWeight: 700,
    color: "#102a43",
    textAlign: "center",
  },
  arrivalTime: {
    flex: 1.5,
    fontSize: 9,
    fontWeight: 600,
    color: "#0284c7",
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    marginTop: 4,
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
  },
  totalTime: {
    fontSize: 10,
    fontWeight: 700,
    color: "#102a43",
  },
  columnHeader: {
    flexDirection: "row",
    paddingVertical: 2,
    marginBottom: 2,
  },
  columnHeaderText: {
    fontSize: 6,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export interface StickerSegment {
  name: string;
  mile: number;
  splitTime: string; // e.g., "1:23"
  arrivalTime: string; // e.g., "7:45 AM"
}

export interface TopTubeStickerProps {
  raceName: string;
  raceDate?: string;
  goalTime?: string;
  segments: StickerSegment[];
  size?: "standard" | "compact" | "extended";
  showNotes?: boolean;
}

export function TopTubeStickerPDF({
  raceName,
  raceDate,
  goalTime,
  segments,
  size = "standard",
}: TopTubeStickerProps) {
  const sizeStyle =
    size === "compact"
      ? styles.stickerCompact
      : size === "extended"
        ? styles.stickerExtended
        : styles.stickerStandard;

  // Adjust font sizes for compact mode
  const fontScale = size === "compact" ? 0.85 : size === "extended" ? 1.1 : 1;

  return (
    <Document>
      <Page size={[sizeStyle.width, sizeStyle.height]} style={styles.page}>
        <View style={{ padding: 8 }}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.raceName, { fontSize: 11 * fontScale }]}>{raceName}</Text>
              {raceDate && <Text style={[styles.raceDate, { fontSize: 8 * fontScale }]}>{raceDate}</Text>}
            </View>
            {goalTime && (
              <Text style={[styles.goalTime, { fontSize: 10 * fontScale }]}>Goal: {goalTime}</Text>
            )}
          </View>

          {/* Column Headers */}
          <View style={styles.columnHeader}>
            <Text style={[styles.columnHeaderText, { flex: 3, fontSize: 6 * fontScale }]}>CHECKPOINT</Text>
            <Text style={[styles.columnHeaderText, { flex: 1, textAlign: "center", fontSize: 6 * fontScale }]}>MI</Text>
            <Text style={[styles.columnHeaderText, { flex: 1.5, textAlign: "center", fontSize: 6 * fontScale }]}>SPLIT</Text>
            <Text style={[styles.columnHeaderText, { flex: 1.5, textAlign: "right", fontSize: 6 * fontScale }]}>ETA</Text>
          </View>

          {/* Splits */}
          {segments.map((segment, index) => {
            const isAlt = index % 2 === 1;
            const isLast = index === segments.length - 1;
            return (
              <View
                key={index}
                style={[
                  styles.splitRow,
                  isAlt ? styles.splitRowAlt : {},
                  isLast ? styles.splitRowLast : {},
                ]}
              >
                <Text style={[styles.checkpointName, { fontSize: 8 * fontScale }]}>{segment.name}</Text>
                <Text style={[styles.splitMile, { fontSize: 8 * fontScale }]}>{segment.mile.toFixed(1)}</Text>
                <Text style={[styles.splitTime, { fontSize: 9 * fontScale }]}>{segment.splitTime}</Text>
                <Text style={[styles.arrivalTime, { fontSize: 9 * fontScale }]}>{segment.arrivalTime}</Text>
              </View>
            );
          })}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { fontSize: 7 * fontScale }]}>Generated by FinalClimb</Text>
            {segments.length > 0 && (
              <Text style={[styles.totalTime, { fontSize: 10 * fontScale }]}>
                Finish: {segments[segments.length - 1]?.arrivalTime}
              </Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
