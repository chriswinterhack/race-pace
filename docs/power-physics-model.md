# Power Physics Model Documentation

This document explains all the physics and mathematics used in RacePace's power calculations.

## Table of Contents
1. [Core Cycling Physics](#core-cycling-physics)
2. [Power Equation](#power-equation)
3. [Speed from Power (Newton-Raphson)](#speed-from-power-newton-raphson)
4. [Normalized Power vs Average Power](#normalized-power-vs-average-power)
5. [Intensity Factor (IF)](#intensity-factor-if)
6. [Altitude Adjustment](#altitude-adjustment)
7. [Terrain Multipliers](#terrain-multipliers)
8. [Time Overhead](#time-overhead)
9. [Air Density at Altitude](#air-density-at-altitude)
10. [Constants Reference](#constants-reference)
11. [Example Calculations](#example-calculations)

---

## Core Cycling Physics

The power required to move a bicycle comes from three main sources of resistance:

1. **Gravity** - Fighting the grade (climbing)
2. **Rolling Resistance** - Tire/surface friction
3. **Aerodynamic Drag** - Air resistance

### The Fundamental Equation

```
Total Power = Power_gravity + Power_rolling + Power_aero
```

Each component:
```
Power_gravity = m × g × grade × v
Power_rolling = m × g × Crr × v
Power_aero = 0.5 × CdA × ρ × v³
```

Where:
- `m` = total mass (rider + bike + gear) in kg
- `g` = gravitational acceleration (9.81 m/s²)
- `grade` = road gradient as decimal (5% = 0.05)
- `v` = velocity in m/s
- `Crr` = coefficient of rolling resistance
- `CdA` = drag area (coefficient of drag × frontal area) in m²
- `ρ` = air density in kg/m³

---

## Power Equation

### Power Required for a Given Speed

```typescript
function calculatePowerFromSpeed(
  speedMps: number,      // Speed in m/s
  totalMassKg: number,   // Total mass in kg
  gradePercent: number,  // Grade as percentage (e.g., 5 for 5%)
  crr: number,           // Rolling resistance coefficient
  cda: number,           // Drag area in m²
  airDensity: number     // Air density in kg/m³
): number {
  const grade = gradePercent / 100;

  const powerGravity = totalMassKg * 9.81 * grade * speedMps;
  const powerRolling = totalMassKg * 9.81 * crr * speedMps;
  const powerAero = 0.5 * cda * airDensity * speedMps ** 3;

  // Account for drivetrain losses (3%)
  const totalPower = (powerGravity + powerRolling + powerAero) / 0.97;

  return Math.max(0, totalPower);
}
```

### Why v³ for Aerodynamic Drag?

Aerodynamic drag force is proportional to v², but power = force × velocity, so:
```
Power_aero = Drag_force × v = (0.5 × CdA × ρ × v²) × v = 0.5 × CdA × ρ × v³
```

This is why aerodynamics matter so much at high speeds - doubling speed requires 8× the power to overcome air resistance.

---

## Speed from Power (Newton-Raphson)

Given a power output, solving for speed requires solving a cubic equation:

```
P = A×v + B×v³
```

Where:
- `A = m × g × (grade + Crr)` (gravity + rolling)
- `B = 0.5 × CdA × ρ` (aero)
- `P = power × efficiency`

### Newton-Raphson Method

We can't solve this algebraically, so we use numerical iteration:

```typescript
function calculateSpeedFromPower(
  powerWatts: number,
  totalMassKg: number,
  gradePercent: number,
  crr: number,
  cda: number,
  airDensity: number
): number {
  const grade = gradePercent / 100;
  const effectivePower = powerWatts * 0.97; // Drivetrain efficiency

  // Newton-Raphson iteration
  let v = 5; // Initial guess: 5 m/s (~11 mph)

  for (let i = 0; i < 20; i++) {
    const A = totalMassKg * 9.81 * (grade + crr);
    const B = 0.5 * cda * airDensity;

    // f(v) = A×v + B×v³ - P = 0
    const f = A * v + B * v * v * v - effectivePower;

    // f'(v) = A + 3×B×v²
    const fPrime = A + 3 * B * v * v;

    if (Math.abs(fPrime) < 0.0001) break;

    // Newton-Raphson: v_new = v - f(v)/f'(v)
    const vNew = v - f / fPrime;

    if (Math.abs(vNew - v) < 0.0001) break; // Converged
    v = Math.max(0.5, vNew); // Don't go below 0.5 m/s
  }

  return v;
}
```

---

## Normalized Power vs Average Power

**This is critical for accurate race predictions.**

### What is Normalized Power (NP)?

NP is a weighted average that accounts for the physiological cost of power variability. It's always higher than average power because:

- Surges and hard efforts cost more metabolically than steady efforts
- Recovery periods don't fully offset the cost of hard efforts
- The body responds to the "stress" of variable power

### The NP Algorithm (from TrainingPeaks)

```
1. Calculate rolling 30-second average power
2. Raise each value to the 4th power
3. Take the average of those values
4. Take the 4th root
```

```typescript
function calculateNP(powerData: number[]): number {
  // 30-second rolling average (at 1Hz sampling)
  const rollingAvg = [];
  for (let i = 29; i < powerData.length; i++) {
    const sum = powerData.slice(i - 29, i + 1).reduce((a, b) => a + b, 0);
    rollingAvg.push(sum / 30);
  }

  // Raise to 4th power, average, then 4th root
  const fourthPowers = rollingAvg.map(p => p ** 4);
  const avgFourth = fourthPowers.reduce((a, b) => a + b, 0) / fourthPowers.length;
  return avgFourth ** 0.25;
}
```

### Variability Index (VI)

```
VI = NP / Average Power
```

Typical values:
- **Road racing (smooth)**: 1.02 - 1.05
- **Gravel racing**: 1.05 - 1.12
- **Mountain biking**: 1.10 - 1.20

**Why this matters for predictions:**

If an athlete targets 170w NP, their average power will actually be:
```
Average Power = NP / VI = 170 / 1.08 = 157w (for gravel)
```

The physics model calculates speed from average power (actual watts being produced), not NP. Using NP directly would overestimate speed.

---

## Intensity Factor (IF)

IF measures effort relative to threshold:

```
IF = NP / FTP
```

### Our Zone Definitions

| Zone | IF Range | Description |
|------|----------|-------------|
| Safe | 0.67 (67%) | Conservative, preserving energy |
| Tempo | 0.70 (70%) | Sustainable race pace |
| Pushing | 0.73 (73%) | Maximum sustainable effort |

### Why These Values?

For ultra-endurance events (4+ hours):
- IF > 0.75 is typically unsustainable
- IF 0.70-0.72 is the "sweet spot" for gravel racing
- IF < 0.65 is leaving performance on the table

---

## Altitude Adjustment

### The Problem

At altitude, the body produces less power due to:
- Reduced oxygen partial pressure
- Lower VO2max
- Impaired lactate clearance

### The Formula

```
Adjusted FTP = FTP × (1 - Altitude Adjustment Factor)
```

### Scaling by Elevation

We don't apply the full adjustment immediately. We scale it:

```typescript
function calculateAltitudeFactor(
  raceElevationFt: number,
  userAdjustmentFactor: number = 0.20
): number {
  const THRESHOLD = 4000;      // ft - below this, no adjustment
  const FULL_THRESHOLD = 8000; // ft - above this, full adjustment

  if (raceElevationFt < THRESHOLD) return 0;

  const scale = Math.min(1,
    (raceElevationFt - THRESHOLD) / (FULL_THRESHOLD - THRESHOLD)
  );

  return userAdjustmentFactor * scale;
}
```

### Research Values

Typical FTP reduction at altitude:
- **5,000 ft**: ~5-8%
- **8,000 ft**: ~15-20%
- **10,000 ft**: ~20-25%
- **12,000 ft**: ~25-30%

Individual variation is significant (hence user-adjustable).

---

## Terrain Multipliers

### The Concept

Cyclists naturally modulate power by terrain:
- **Climbs**: Push harder (power has more impact on speed)
- **Flats/Descents**: Back off (aero dominates, diminishing returns)

### Our Multipliers (Fixed)

```typescript
const TERRAIN_MULTIPLIERS = {
  climb: 1.20,  // +20% on climbs
  flat: 0.90,   // -10% on flats/descents
};
```

### Why +20%/-10%?

This maintains target NP while optimizing for speed:
- On climbs: Speed is low, power-to-speed ratio is high, so push harder
- On flats: Speed is high, aero losses are cubic, so back off

Example with 170w target NP:
- Climbing: 170 × 1.20 = 204w
- Flat: 170 × 0.90 = 153w

---

## Time Overhead

### Non-Moving Time

Real race time includes stops for:
- Aid station refueling
- Mechanicals (flat fixes)
- Navigation checks
- Nature breaks
- Photo ops

### Our Model

```typescript
const TIME_OVERHEAD = {
  short: 0.05,   // < 4 hours: +5%
  medium: 0.10,  // 4-8 hours: +10%
  long: 0.15,    // > 8 hours: +15%
};
```

### Application

```typescript
function getOverheadFactor(movingTimeMinutes: number): number {
  if (movingTimeMinutes < 240) return 0.05;      // < 4 hours
  if (movingTimeMinutes < 480) return 0.10;      // 4-8 hours
  return 0.15;                                    // > 8 hours
}

totalTime = movingTime × (1 + overheadFactor);
```

---

## Air Density at Altitude

Air is thinner at altitude, reducing aerodynamic drag:

```typescript
function calculateAirDensity(elevationMeters: number): number {
  const SEA_LEVEL_DENSITY = 1.225; // kg/m³

  // Barometric formula (exponential decay)
  return SEA_LEVEL_DENSITY * Math.exp(-elevationMeters / 8500);
}
```

### Values by Elevation

| Elevation | Air Density | % of Sea Level |
|-----------|-------------|----------------|
| Sea level | 1.225 kg/m³ | 100% |
| 5,000 ft (1524m) | 1.056 kg/m³ | 86% |
| 8,000 ft (2438m) | 0.930 kg/m³ | 76% |
| 10,000 ft (3048m) | 0.856 kg/m³ | 70% |
| 12,000 ft (3658m) | 0.789 kg/m³ | 64% |

**Note:** Lower air density helps speed (less drag) but hurts power output (less oxygen). The power loss typically exceeds the aero benefit.

---

## Constants Reference

### Rolling Resistance (Crr)

| Surface | Crr | Description |
|---------|-----|-------------|
| Road | 0.004 | Smooth asphalt |
| Gravel | 0.008 | Mixed gravel/dirt |
| MTB | 0.012 | Rough singletrack |

### Drag Area (CdA)

| Position | CdA (m²) | Description |
|----------|----------|-------------|
| Drops | 0.32 | Aggressive aero position |
| Hoods | 0.40 | Normal road position |
| Gravel | 0.45 | Upright gravel position |

### Other Constants

```typescript
const GRAVITY = 9.81;              // m/s²
const AIR_DENSITY_SEA_LEVEL = 1.225; // kg/m³
const DRIVETRAIN_EFFICIENCY = 0.97;  // 97% (3% loss)
const DEFAULT_BIKE_WEIGHT = 10;      // kg
```

---

## Example Calculations

### Example 1: Required Power for Speed on Flat

**Given:**
- Rider: 70kg
- Bike: 10kg
- Speed: 30 km/h (8.33 m/s)
- Grade: 0%
- Surface: Gravel (Crr = 0.008)
- Position: Gravel (CdA = 0.45)
- Elevation: Sea level

**Calculate:**
```
Total mass = 70 + 10 = 80 kg

Power_gravity = 80 × 9.81 × 0 × 8.33 = 0 W
Power_rolling = 80 × 9.81 × 0.008 × 8.33 = 52.3 W
Power_aero = 0.5 × 0.45 × 1.225 × 8.33³ = 159.5 W

Total = (0 + 52.3 + 159.5) / 0.97 = 218 W
```

### Example 2: Speed from Power on Climb

**Given:**
- Power: 250 W
- Rider: 70kg, Bike: 10kg
- Grade: 6%
- Gravel surface

**Newton-Raphson iteration:**
```
A = 80 × 9.81 × (0.06 + 0.008) = 53.4
B = 0.5 × 0.45 × 1.225 = 0.276
P = 250 × 0.97 = 242.5

Starting v = 5 m/s
Iteration 1: f = 53.4×5 + 0.276×125 - 242.5 = 59.0
             f' = 53.4 + 3×0.276×25 = 74.1
             v = 5 - 59.0/74.1 = 4.20

Iteration 2: f = 53.4×4.2 + 0.276×74.1 - 242.5 = 2.7
             f' = 53.4 + 3×0.276×17.6 = 68.0
             v = 4.20 - 2.7/68.0 = 4.16

Converged at v ≈ 4.16 m/s = 15 km/h = 9.3 mph
```

### Example 3: Race Time Estimation

**Given:**
- Distance: 100 miles (161 km)
- Elevation gain: 10,000 ft (3048 m)
- Target NP: 170 W
- Rider: 70kg
- Surface: Gravel (VI = 1.08)

**Calculate:**
```
1. Convert NP to Average Power:
   Avg Power = 170 / 1.08 = 157 W

2. Split course 50/50 climb/flat:
   Climb distance = 80.5 km
   Flat distance = 80.5 km

3. Calculate climb power:
   Climb NP = 170 × 1.20 = 204 W
   Climb Avg = 204 / 1.08 = 189 W

4. Calculate flat power:
   Flat NP = 170 × 0.90 = 153 W
   Flat Avg = 153 / 1.08 = 142 W

5. Calculate average grade:
   Avg grade = (3048 / 161000) × 100 × 2 = 3.8%

6. Calculate speeds (Newton-Raphson):
   Climb speed ≈ 3.2 m/s (7.2 mph)
   Flat speed ≈ 7.1 m/s (15.9 mph)

7. Calculate times:
   Climb time = 80500 / 3.2 = 25156 sec = 7.0 hours
   Flat time = 80500 / 7.1 = 11338 sec = 3.1 hours
   Moving time = 10.1 hours

8. Add overhead (10% for medium duration):
   Total time = 10.1 × 1.10 = 11.1 hours
```

---

## Advanced Models (v2)

The following improvements have been implemented to address the original limitations:

### 1. Course Profile Analysis

Instead of assuming 50/50 climb/flat split, we now analyze actual elevation data:

```typescript
interface CourseProfile {
  totalDistanceM: number;
  climbingDistanceM: number;    // Distance where grade >= 2%
  flatDistanceM: number;        // Distance where -2% < grade < 2%
  descentDistanceM: number;     // Distance where grade <= -2%
  climbingPct: number;          // Percentage of course climbing
  flatPct: number;
  descentPct: number;
  avgClimbGradePct: number;     // Average grade on climbs
  avgDescentGradePct: number;
  totalElevationGainM: number;
  totalElevationLossM: number;
}
```

**Grade Classification Thresholds:**
- Climbing: >= 2% grade
- Flat: -2% to 2% grade
- Descent: <= -2% grade

**Functions:**
- `analyzeCourseProfile(elevationPoints)` - Uses actual GPX data
- `estimateCourseProfile(distanceM, elevationGainM)` - Estimates from summary data

---

### 2. Surface-Weighted Rolling Resistance

Instead of a single Crr value, we calculate weighted average from surface composition:

```typescript
interface SurfaceComposition {
  gravel_pct: number;      // Crr = 0.008
  pavement_pct: number;    // Crr = 0.004
  singletrack_pct: number; // Crr = 0.012
  dirt_pct: number;        // Crr = 0.010
}
```

**Example:** 60% gravel, 30% pavement, 10% singletrack
```
Crr = (60 × 0.008 + 30 × 0.004 + 10 × 0.012) / 100 = 0.0072
```

---

### 3. Fatigue / Decoupling Model

Power output decreases over time:

| Time | Power Multiplier | Description |
|------|------------------|-------------|
| 0-2 hours | 100% | Glycogen-fueled |
| 2-4 hours | 98% | Fat metabolism transition |
| 4-6 hours | 95% | Glycogen depletion |
| 6-8 hours | 92% | Cumulative fatigue |
| 8-10 hours | 88% | Ultra-endurance |
| 10+ hours | 85% | Maximum degradation |

**Functions:**
- `calculateFatigueFactor(elapsedMinutes)` - Returns 0.85-1.0
- `calculateAverageFatigueFactor(totalMinutes)` - Average over race

---

### 4. Advanced Estimation Function

`estimateFinishTimeAdvanced()` combines all models and returns detailed breakdown:

```typescript
interface FinishTimeResult {
  totalMinutes: number;
  movingTimeMinutes: number;
  climbingTimeMinutes: number;
  flatTimeMinutes: number;
  descentTimeMinutes: number;
  overheadMinutes: number;
  avgSpeedKph: number;
  climbingSpeedKph: number;
  flatSpeedKph: number;
  descentSpeedKph: number;
  fatigueFactor: number;
  effectiveCrr: number;
  courseProfile: CourseProfile;
}
```

---

## Remaining Limitations

1. **No wind modeling** - Significant factor (±10-20% time impact)
2. **No drafting** - Reduces power by 20-40% in groups
3. **Temperature not modeled** - Affects air density (±3%) and physiology
4. **Static fatigue curve** - Doesn't account for fitness or nutrition
5. **Constant power assumption** - Reality has surges and recovery

---

## References

- Coggan, A. (2003). "Training and Racing Using a Power Meter"
- Martin, J.C. et al. (1998). "Validation of a Mathematical Model for Road Cycling Power"
- Bassett, D.R. et al. (1999). "Comparing Cycling World Hour Records"
- TrainingPeaks documentation on Normalized Power
- Silca "Marginal Gains" calculator methodology
