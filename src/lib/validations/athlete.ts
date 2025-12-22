import { z } from "zod";

export const athleteProfileSchema = z.object({
  weight_kg: z
    .number()
    .min(30, "Weight must be at least 30 kg")
    .max(200, "Weight must be at most 200 kg"),
  ftp_watts: z
    .number()
    .min(50, "FTP must be at least 50 watts")
    .max(500, "FTP must be at most 500 watts"),
  altitude_adjustment_factor: z
    .number()
    .min(0, "Altitude adjustment must be positive")
    .max(0.5, "Altitude adjustment must be at most 50%")
    .default(0.20),
  // Intensity factors for power zones
  if_safe: z
    .number()
    .min(0.50, "Safe IF must be at least 50%")
    .max(0.80, "Safe IF must be at most 80%")
    .default(0.67),
  if_tempo: z
    .number()
    .min(0.55, "Tempo IF must be at least 55%")
    .max(0.85, "Tempo IF must be at most 85%")
    .default(0.70),
  if_pushing: z
    .number()
    .min(0.60, "Pushing IF must be at least 60%")
    .max(0.90, "Pushing IF must be at most 90%")
    .default(0.73),
  // Nutrition defaults
  nutrition_cho_per_hour: z
    .number()
    .min(30, "Carbs per hour must be at least 30g")
    .max(150, "Carbs per hour must be at most 150g")
    .default(90),
  hydration_ml_per_hour: z
    .number()
    .min(250, "Hydration must be at least 250ml/hour")
    .max(1500, "Hydration must be at most 1500ml/hour")
    .default(750),
  sodium_mg_per_hour: z
    .number()
    .min(200, "Sodium must be at least 200mg/hour")
    .max(1500, "Sodium must be at most 1500mg/hour")
    .default(750),
  preferred_units: z.enum(["metric", "imperial"]).default("metric"),
});

export type AthleteProfileInput = z.infer<typeof athleteProfileSchema>;

// Intensity factors schema for power settings
export const intensityFactorsSchema = z.object({
  safe: z.number().min(0.50).max(0.80).default(0.67),
  tempo: z.number().min(0.55).max(0.85).default(0.70),
  pushing: z.number().min(0.60).max(0.90).default(0.73),
});

export type IntensityFactorsInput = z.infer<typeof intensityFactorsSchema>;
