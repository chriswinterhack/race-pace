"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Rect,
  Image,
} from "@react-pdf/renderer";

// Same sizes as top tube sticker
const SIZES = {
  compact: { width: 144, height: 504 },   // 2" x 7"
  standard: { width: 162, height: 648 },  // 2.25" x 9"
  extended: { width: 180, height: 792 },  // 2.5" x 11"
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
  navy50: "#f0f4f8",
  sky600: "#0284c7",
  sky500: "#0ea5e9",
  sky400: "#38bdf8",
  white: "#ffffff",
  orange500: "#f97316",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.white,
    fontFamily: "Helvetica",
  },
});

export interface NutritionProduct {
  name: string;
  brand: string;
  quantity: number;
  carbs: number;
  caffeine?: number;
}

export interface NutritionHourData {
  hourNumber: number;
  elapsedTime: string;
  clockTime: string;
  products: NutritionProduct[];
  waterMl: number;
  totals: {
    carbs: number;
    sodium: number;
    fluid: number;
    caffeine: number;
  };
}

export interface NutritionStickerProps {
  raceName: string;
  raceDate?: string;
  totalHours: number;
  hours: NutritionHourData[];
  size?: "standard" | "compact" | "extended";
}

export function NutritionStickerPDF({
  raceName,
  raceDate,
  totalHours,
  hours,
  size = "standard",
}: NutritionStickerProps) {
  const dim = SIZES[size];
  const fontScale = size === "compact" ? 0.85 : size === "extended" ? 1.1 : 1;

  // Layout calculations
  const headerHeight = 36 * fontScale;
  const footerHeight = 30 * fontScale;
  const contentHeight = dim.height - headerHeight - footerHeight;

  // Each hour gets equal space - products are the star of the show
  const hourRowHeight = contentHeight / Math.max(totalHours, 1);
  const sidePadding = 4;

  return (
    <Document>
      <Page size={[dim.width, dim.height]} style={styles.page}>
        <Svg width={dim.width} height={dim.height} viewBox={`0 0 ${dim.width} ${dim.height}`}>
          {/* White background */}
          <Rect x={0} y={0} width={dim.width} height={dim.height} fill={COLORS.white} />

          {/* Header */}
          <Rect x={0} y={0} width={dim.width} height={headerHeight} fill={COLORS.navy900} />
          <Rect x={0} y={headerHeight - 2} width={dim.width} height={2} fill={COLORS.sky400} />

          {/* Alternating row backgrounds for readability */}
          {hours.map((_, index) => (
            <Rect
              key={`bg-${index}`}
              x={0}
              y={headerHeight + index * hourRowHeight}
              width={dim.width}
              height={hourRowHeight}
              fill={index % 2 === 0 ? COLORS.white : COLORS.navy50}
            />
          ))}

          {/* Row dividers */}
          {hours.map((_, index) => (
            <Rect
              key={`line-${index}`}
              x={0}
              y={headerHeight + (index + 1) * hourRowHeight - 0.5}
              width={dim.width}
              height={0.5}
              fill={COLORS.navy200}
            />
          ))}

          {/* Footer */}
          <Rect x={0} y={dim.height - footerHeight} width={dim.width} height={footerHeight} fill={COLORS.navy900} />
          <Rect x={0} y={dim.height - footerHeight} width={dim.width} height={2} fill={COLORS.sky400} />
        </Svg>

        {/* Text overlay */}
        <View style={{ position: "absolute", top: 0, left: 0, width: dim.width, height: dim.height }}>
          {/* Header */}
          <View style={{ height: headerHeight, paddingHorizontal: 6, paddingTop: 5 }}>
            <Text style={{
              fontSize: 8 * fontScale,
              fontFamily: "Helvetica-Bold",
              color: COLORS.white,
              textAlign: "center",
              marginBottom: 1,
            }}>
              NUTRITION - {raceName.toUpperCase()}
            </Text>
            {raceDate && (
              <Text style={{
                fontSize: 7 * fontScale,
                color: COLORS.sky400,
                textAlign: "center",
              }}>
                {raceDate}
              </Text>
            )}
          </View>

          {/* Hour rows - PRODUCTS ARE THE FOCUS */}
          {hours.map((hour, index) => {
            const maxProducts = size === "extended" ? 5 : size === "compact" ? 3 : 4;
            const displayProducts = hour.products.slice(0, maxProducts);
            const remainingCount = hour.products.length - maxProducts;

            return (
              <View
                key={`hour-${hour.hourNumber}`}
                style={{
                  position: "absolute",
                  top: headerHeight + index * hourRowHeight,
                  left: 0,
                  width: dim.width,
                  height: hourRowHeight,
                  flexDirection: "row",
                }}
              >
                {/* Hour badge - left side */}
                <View style={{
                  width: 24 * fontScale,
                  height: hourRowHeight,
                  backgroundColor: COLORS.sky500,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Text style={{
                    fontSize: 10 * fontScale,
                    fontFamily: "Helvetica-Bold",
                    color: COLORS.white,
                  }}>
                    {hour.hourNumber}
                  </Text>
                  <Text style={{
                    fontSize: 5 * fontScale,
                    color: COLORS.white,
                    opacity: 0.8,
                  }}>
                    {hour.clockTime.split(" ")[0]}
                  </Text>
                </View>

                {/* Products list - main content */}
                <View style={{
                  flex: 1,
                  paddingLeft: 4,
                  paddingRight: sidePadding,
                  paddingVertical: 2,
                  justifyContent: "center",
                }}>
                  {displayProducts.length === 0 ? (
                    <Text style={{
                      fontSize: 7 * fontScale,
                      color: COLORS.navy400,
                      fontStyle: "italic"
                    }}>
                      (rest / water only)
                    </Text>
                  ) : (
                    displayProducts.map((product, pIndex) => (
                      <View
                        key={`p-${pIndex}`}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: pIndex < displayProducts.length - 1 ? 1.5 : 0,
                        }}
                      >
                        {/* Quantity indicator */}
                        {product.quantity > 1 && (
                          <View style={{
                            backgroundColor: COLORS.navy200,
                            borderRadius: 2,
                            paddingHorizontal: 2,
                            marginRight: 3,
                          }}>
                            <Text style={{
                              fontSize: 6 * fontScale,
                              fontFamily: "Helvetica-Bold",
                              color: COLORS.navy700,
                            }}>
                              {product.quantity}x
                            </Text>
                          </View>
                        )}

                        {/* Product name - THE MAIN DATA */}
                        <Text style={{
                          fontSize: 7.5 * fontScale,
                          fontFamily: "Helvetica-Bold",
                          color: COLORS.navy900,
                          flex: 1,
                        }}>
                          {product.brand} {product.name}
                        </Text>

                        {/* Caffeine indicator */}
                        {product.caffeine && product.caffeine > 0 && (
                          <View style={{
                            backgroundColor: COLORS.orange500,
                            borderRadius: 2,
                            paddingHorizontal: 2,
                            marginLeft: 2,
                          }}>
                            <Text style={{
                              fontSize: 5 * fontScale,
                              fontFamily: "Helvetica-Bold",
                              color: COLORS.white,
                            }}>
                              CAF
                            </Text>
                          </View>
                        )}
                      </View>
                    ))
                  )}

                  {/* Overflow indicator */}
                  {remainingCount > 0 && (
                    <Text style={{
                      fontSize: 5.5 * fontScale,
                      color: COLORS.navy500,
                      marginTop: 1,
                    }}>
                      +{remainingCount} more items
                    </Text>
                  )}

                  {/* Water note if present and no products or space allows */}
                  {hour.waterMl > 0 && displayProducts.length <= 2 && (
                    <Text style={{
                      fontSize: 5.5 * fontScale,
                      color: COLORS.sky600,
                      marginTop: 1,
                    }}>
                      +{hour.waterMl}ml water
                    </Text>
                  )}
                </View>
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
            paddingTop: 4,
            alignItems: "center",
          }}>
            <Image
              src="/images/finalclimb-logo.png"
              style={{ width: 70 * fontScale, height: 17 * fontScale }}
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}
