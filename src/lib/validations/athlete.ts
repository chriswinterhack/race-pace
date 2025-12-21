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
