import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface DemoUser {
  email: string;
  displayName: string;
  weightKg: number;
  ftpWatts: number;
}

interface DemoBike {
  brand: string;
  model: string;
  year: number;
  bikeType: string;
}

interface DemoTire {
  brand: string;
  model: string;
  widthValue: number;
  widthUnit: string;
}

interface DemoRepairKit {
  name: string;
  items: string[];
}

const DEMO_USERS: DemoUser[] = [
  { email: "mike.summit@demo.finalclimb.com", displayName: "Mike S.", weightKg: 75, ftpWatts: 280 },
  { email: "sarah.trails@demo.finalclimb.com", displayName: "Sarah T.", weightKg: 58, ftpWatts: 220 },
  { email: "jake.altitude@demo.finalclimb.com", displayName: "Jake A.", weightKg: 82, ftpWatts: 310 },
  { email: "emma.peaks@demo.finalclimb.com", displayName: "Emma P.", weightKg: 62, ftpWatts: 235 },
  { email: "chris.gravel@demo.finalclimb.com", displayName: "Chris G.", weightKg: 78, ftpWatts: 290 },
  { email: "lisa.enduro@demo.finalclimb.com", displayName: "Lisa E.", weightKg: 55, ftpWatts: 210 },
  { email: "ryan.singletrack@demo.finalclimb.com", displayName: "Ryan S.", weightKg: 70, ftpWatts: 260 },
  { email: "nicole.climb@demo.finalclimb.com", displayName: "Nicole C.", weightKg: 60, ftpWatts: 225 },
];

const DEMO_BIKES: DemoBike[] = [
  { brand: "Yeti", model: "SB130", year: 2024, bikeType: "mtb" },
  { brand: "Santa Cruz", model: "Blur", year: 2024, bikeType: "mtb" },
  { brand: "Specialized", model: "Epic EVO", year: 2024, bikeType: "mtb" },
  { brand: "Trek", model: "Supercaliber", year: 2023, bikeType: "mtb" },
  { brand: "Pivot", model: "Mach 4 SL", year: 2024, bikeType: "mtb" },
  { brand: "Scott", model: "Spark RC", year: 2024, bikeType: "mtb" },
  { brand: "Canyon", model: "Lux Trail", year: 2024, bikeType: "mtb" },
  { brand: "Yeti", model: "SB115", year: 2023, bikeType: "mtb" },
];

const DEMO_TIRES: DemoTire[] = [
  { brand: "Maxxis", model: "Aspen", widthValue: 2.25, widthUnit: "in" },
  { brand: "Maxxis", model: "Rekon Race", widthValue: 2.35, widthUnit: "in" },
  { brand: "Specialized", model: "Renegade", widthValue: 2.2, widthUnit: "in" },
  { brand: "Vittoria", model: "Mezcal", widthValue: 2.25, widthUnit: "in" },
  { brand: "Schwalbe", model: "Racing Ralph", widthValue: 2.25, widthUnit: "in" },
  { brand: "Maxxis", model: "Aspen", widthValue: 2.4, widthUnit: "in" },
  { brand: "Continental", model: "Race King", widthValue: 2.2, widthUnit: "in" },
  { brand: "Maxxis", model: "Ikon", widthValue: 2.35, widthUnit: "in" },
];

const DEMO_REPAIR_KITS: DemoRepairKit[] = [
  { name: "Leadville Kit", items: ["Tube", "CO2 x3", "Tire plugs", "Multi-tool", "Chain links", "Derailleur hanger"] },
  { name: "Race Day Essentials", items: ["Tube", "CO2 x2", "Tire plugs", "Bacon strips", "Multi-tool"] },
  { name: "Full Repair Setup", items: ["Tube x2", "Mini pump", "CO2 x2", "Tire plugs", "Multi-tool", "Chain breaker", "Spare derailleur hanger", "Zip ties"] },
  { name: "Minimal Kit", items: ["Tube", "CO2 x2", "Tire plugs", "Multi-tool"] },
];

export async function POST(request: Request) {
  // Basic auth check (in production, add proper admin auth)
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.ADMIN_SEED_KEY || "seed-demo-12345";

  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get Leadville race info
    const { data: race } = await supabaseAdmin
      .from("races")
      .select("id")
      .eq("slug", "leadville-100")
      .single();

    if (!race) {
      return NextResponse.json({ error: "Leadville race not found" }, { status: 404 });
    }

    const { data: edition } = await supabaseAdmin
      .from("race_editions")
      .select("id")
      .eq("race_id", race.id)
      .limit(1)
      .single();

    if (!edition) {
      return NextResponse.json({ error: "Leadville edition not found" }, { status: 404 });
    }

    const { data: distance } = await supabaseAdmin
      .from("race_distances")
      .select("id")
      .eq("race_edition_id", edition.id)
      .limit(1)
      .single();

    if (!distance) {
      return NextResponse.json({ error: "Leadville distance not found" }, { status: 404 });
    }

    const createdUsers: string[] = [];
    const results: string[] = [];

    // Create demo users
    for (let i = 0; i < DEMO_USERS.length; i++) {
      const demoUser = DEMO_USERS[i]!;
      const demoBike = DEMO_BIKES[i]!;
      const demoTire = DEMO_TIRES[i]!;
      const demoKit = DEMO_REPAIR_KITS[i];

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", demoUser.email)
        .single();

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        results.push(`User ${demoUser.email} already exists`);
      } else {
        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: demoUser.email,
          password: "demo-password-123!",
          email_confirm: true,
        });

        if (authError) {
          results.push(`Failed to create auth user ${demoUser.email}: ${authError.message}`);
          continue;
        }

        userId = authUser.user.id;

        // Create public user (trigger should handle this, but let's be safe)
        await supabaseAdmin.from("users").upsert({
          id: userId,
          email: demoUser.email,
          name: demoUser.displayName,
          role: "athlete",
          subscription_status: "active",
          profile_public: true,
        });

        results.push(`Created user ${demoUser.email}`);
      }

      createdUsers.push(userId);

      // Create/update athlete profile
      await supabaseAdmin.from("athlete_profiles").upsert({
        user_id: userId,
        display_name: demoUser.displayName,
        weight_kg: demoUser.weightKg,
        ftp_watts: demoUser.ftpWatts,
        preferred_units: "imperial",
      }, { onConflict: "user_id" });

      // Create race plan
      const { data: existingPlan } = await supabaseAdmin
        .from("race_plans")
        .select("id")
        .eq("user_id", userId)
        .eq("race_distance_id", distance.id)
        .single();

      if (!existingPlan) {
        await supabaseAdmin.from("race_plans").insert({
          user_id: userId,
          race_id: race.id,
          race_distance_id: distance.id,
          goal_time_minutes: 480 + i * 30,
          status: "draft",
        });
        results.push(`Created race plan for ${demoUser.email}`);
      }

      // Create bike
      const { data: bike } = await supabaseAdmin
        .from("user_bikes")
        .insert({
          user_id: userId,
          brand: demoBike.brand,
          model: demoBike.model,
          year: demoBike.year,
          bike_type: demoBike.bikeType,
        })
        .select("id")
        .single();

      // Create tires (front and rear)
      const { data: frontTire } = await supabaseAdmin
        .from("user_tires")
        .insert({
          user_id: userId,
          brand: demoTire.brand,
          model: demoTire.model,
          width_value: demoTire.widthValue,
          width_unit: demoTire.widthUnit,
          tire_type: "tubeless",
        })
        .select("id")
        .single();

      // Create repair kit for some users
      let repairKitId: string | null = null;
      if (demoKit) {
        const { data: kit } = await supabaseAdmin
          .from("user_repair_kits")
          .insert({
            user_id: userId,
            name: demoKit.name,
            items: demoKit.items,
          })
          .select("id")
          .single();
        repairKitId = kit?.id || null;
      }

      // Create race gear selection (make last user private)
      const isPublic = i < DEMO_USERS.length - 1;

      await supabaseAdmin.from("race_gear_selections").upsert({
        user_id: userId,
        race_id: race.id,
        race_distance_id: distance.id,
        bike_id: bike?.id,
        front_tire_id: frontTire?.id,
        rear_tire_id: frontTire?.id,
        repair_kit_id: repairKitId,
        is_public: isPublic,
      }, { onConflict: "user_id,race_distance_id" });

      results.push(`Created gear for ${demoUser.email} (public: ${isPublic})`);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${createdUsers.length} demo users with gear for Leadville`,
      details: results,
    });

  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET to check status
export async function GET() {
  try {
    const { data: race } = await supabaseAdmin
      .from("races")
      .select("id, name")
      .eq("slug", "leadville-100")
      .single();

    if (!race) {
      return NextResponse.json({ error: "Leadville race not found" }, { status: 404 });
    }

    const { count: userCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .like("email", "%@demo.finalclimb.com");

    const { count: gearCount } = await supabaseAdmin
      .from("race_gear_selections")
      .select("*", { count: "exact", head: true })
      .eq("race_id", race.id);

    return NextResponse.json({
      race: race.name,
      demoUsers: userCount,
      gearSelections: gearCount,
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
