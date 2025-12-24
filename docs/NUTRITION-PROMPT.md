# Nutrition Planner - Claude Code Build Prompt

Build the complete Nutrition Planner for The Final Climb. This is a flagship feature that will be heavily marketed - it needs to be world-class.

Read CLAUDE.md for project context, then read /mnt/skills/public/frontend-design/SKILL.md for creative direction. This feature must be visually stunning, highly interactive, and built on proven sports science.

---

## OVERVIEW

The Nutrition Planner helps cyclists map out their entire race-day fueling strategy with scientific recommendations, a visual drag-and-drop timeline builder, and integration with aid stations, drop bags, and crew handoffs. Users should be able to:

1. See personalized hourly intake targets based on their race, weather, and body
2. Browse a database of real nutrition products with detailed macros
3. Drag products onto an hour-by-hour timeline
4. See real-time totals vs. targets (carbs, calories, sodium, water)
5. Mark where nutrition comes from: on-bike, aid station, drop bag, or crew
6. Export the plan to PDF, top tube sticker, or sync to Garmin

---

## PART 1: SPORTS SCIENCE ENGINE

### Carbohydrate Recommendations

Use the current scientific consensus for endurance carbohydrate intake:

**Base recommendations by duration:**
- < 1 hour: Water only, no carbs needed
- 1-2 hours: 30-60g carbs/hour
- 2-3 hours: 60-90g carbs/hour  
- 3+ hours: 80-120g carbs/hour (gut-trained athletes can push to 120g+)

**The 1:0.8 Glucose:Fructose Ratio Rule:**
At intakes >60g/hour, athletes MUST use multiple transportable carbohydrates (glucose + fructose) to maximize absorption. The gut has separate transporters:
- SGLT1 transporter: ~60g/hour glucose max
- GLUT5 transporter: ~30-40g/hour fructose max

Combined, athletes can absorb 90-120g/hour. Products with 1:0.8 or 2:1 glucose:fructose ratios are optimal. Flag products that have good ratios vs. glucose-only products.

**Intensity adjustment:**
- Higher intensity = favor simple sugars, gels, liquids
- Lower intensity = can include solid foods, bars

**Altitude adjustment:**
- Above 8,000ft: Increase carb targets by 10-15% (increased glycolytic demand)
- Above 10,000ft: Increase by 15-20%

### Hydration Recommendations

**Base fluid needs:**
- Temperate conditions (50-70°F): 500-750ml/hour
- Warm conditions (70-85°F): 750-1000ml/hour  
- Hot conditions (85°F+): 1000-1500ml/hour

**Humidity adjustment:**
- High humidity (>70%): Increase by 15-25% (impaired evaporative cooling)

**Sweat rate personalization (future feature):**
Allow users to input their known sweat rate if tested

**Weight-based baseline:**
- Light riders (<65kg): Lower end of ranges
- Heavy riders (>85kg): Higher end of ranges

### Sodium/Electrolyte Recommendations

**Base sodium needs:**
- Light sweater: 300-500mg/hour
- Average sweater: 500-700mg/hour
- Heavy/salty sweater: 700-1000mg/hour

**Heat adjustment:**
- Add 200-300mg/hour in hot conditions
- Add 100-200mg/hour in high humidity

**Signs user may need more sodium (educational content):**
- White salt stains on kit
- Muscle cramps history
- Bloating or sloshing stomach

### Calculation Implementation

Create: `lib/calculations/nutritionScience.ts`

```typescript
interface NutritionInputs {
  raceDurationHours: number;
  elevationGainFt: number;
  maxElevationFt: number;
  temperatureF: number;
  humidity: number;
  athleteWeightKg: number;
  sweatRate?: 'light' | 'average' | 'heavy';
  gutTrainingLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface HourlyTargets {
  carbsGramsMin: number;
  carbsGramsMax: number;
  carbsGramsTarget: number;
  fluidMlMin: number;
  fluidMlMax: number;
  fluidMlTarget: number;
  sodiumMgMin: number;
  sodiumMgMax: number;
  sodiumMgTarget: number;
  caloriesTarget: number;
}

interface RaceNutritionPlan {
  hourlyTargets: HourlyTargets;
  totalTargets: {
    carbs: number;
    calories: number;
    sodium: number;
    fluid: number;
  };
  warnings: string[];
  recommendations: string[];
}
```

---

## PART 2: NUTRITION PRODUCT DATABASE

### Data Model

```typescript
interface NutritionProduct {
  id: string;
  brand: string;
  name: string;
  category: 'gel' | 'chew' | 'bar' | 'drink_mix' | 'real_food' | 'electrolyte' | 'other';
  
  // Per serving
  servingSize: string;
  calories: number;
  carbsGrams: number;
  sodiumMg: number;
  
  // Advanced carb data
  sugarsGrams?: number;
  glucoseGrams?: number;
  fructoseGrams?: number;
  maltodextrinGrams?: number;
  glucoseFructoseRatio?: string; // "1:0.8", "2:1", "glucose-only"
  
  // Additional
  caffeineMg?: number;
  proteinGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  
  // Metadata
  imageUrl?: string;
  isVerified: boolean;
  isUserSubmitted: boolean;
  notes?: string;
  
  // Hydration
  waterContentMl?: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Seed Data - Popular Products to Include

**Gels:**
- GU Energy Gel (various flavors, some with caffeine)
- Maurten Gel 100, Gel 100 CAF 100
- SiS GO Isotonic Energy Gel
- Clif Shot Energy Gel
- Honey Stinger Organic Energy Gel
- Spring Energy (Awesome Sauce, Canaberry, etc.)
- Precision Fuel & Hydration PF 30 Gel
- Neversecond C30 Gel

**Chews:**
- Clif Bloks
- GU Energy Chews
- Skratch Labs Energy Chews
- Honey Stinger Chews
- Gatorade Endurance Carb Energy Chews

**Bars:**
- Clif Bar
- Maurten Solid 225, Solid 160
- Skratch Labs Anytime Energy Bar
- Honey Stinger Waffle
- Spring Energy Bars
- Bobo's Oat Bars

**Drink Mixes:**
- Maurten Drink Mix 160, 320
- Skratch Labs Sport Hydration Mix
- Precision Hydration PH 1000, 1500
- Gatorade Endurance Formula
- Tailwind Nutrition (Endurance Fuel)
- Neversecond C90 High Carb Drink Mix
- SiS Beta Fuel

**Electrolytes (low/no calorie):**
- LMNT
- Precision Hydration tablets
- Nuun Sport
- SaltStick Caps
- SiS GO Hydro

**Real Food:**
- Banana (medium)
- PB&J sandwich (half)
- Rice cake (homemade)
- Potato (boiled, salted)
- Dates (medjool)
- Fig bars

### Admin Interface

Build `/admin/nutrition-products` with:
- DataTable (TanStack Table) listing all products
- Add/Edit form with all fields
- Image upload (Supabase Storage)
- Bulk import via CSV
- Mark as verified
- Search and filter by category, brand

### User Features

- "My Foods" - users can favorite products
- "Add Custom Food" - users can add their own products (not shared globally)
- Search with filters (category, brand, caffeine-free, etc.)

---

## PART 3: DRAG AND DROP TIMELINE BUILDER

### Library

Use `@dnd-kit/core` and `@dnd-kit/sortable` - the most flexible and accessible drag-and-drop library for React.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NUTRITION TARGETS SUMMARY                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Carbs/Hour  │ │ Fluid/Hour  │ │ Sodium/Hour │ │ Race Total  │       │
│  │ 90-110g     │ │ 750-1000ml  │ │ 500-700mg   │ │ 12 hours    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│  Based on: Leadville 100 • 12,500ft max • 75°F • 45% humidity          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┬──────────────────────────────────┐
│  PRODUCT PALETTE                     │  TIMELINE BUILDER                │
│  ┌────────────────────────────────┐  │                                  │
│  │ 🔍 Search products...          │  │  ┌─ ELEVATION PROFILE ─────────┐│
│  └────────────────────────────────┘  │  │  [Course with aid stations] ││
│                                      │  └───────────────────────────────┘│
│  [Gels] [Chews] [Bars] [Drinks]     │                                  │
│  [Real Food] [Electrolytes] [♥]     │  ┌─ HOUR 1 (Start → Pipeline) ─┐│
│                                      │  │ [Gel] [Gel] [Chew]    72g   ││
│  ┌──────────────────────────────┐   │  │                     750ml   ││
│  │ 🍯 Maurten Gel 100           │   │  │                     420mg   ││
│  │    25g carbs • 100 cal       │   │  └───────────────────────────────┘│
│  │    1:0.8 ratio ✓             │   │                                  │
│  └──────────────────────────────┘   │  ┌─ HOUR 2 ──────────────────────┐│
│                                      │  │ [Drag products here]         ││
│  ... more products                   │  └───────────────────────────────┘│
│                                      │                                  │
│                                      │  ═══ AID STATION: Pipeline ═════ │
│                                      │  Mile 24 • Drop Bag: Yes         │
│                                      │  What you're picking up:         │
│                                      │  [Drag products here]            │
│                                      │  Water refill: [+500ml]          │
└──────────────────────────────────────┴──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  RUNNING TOTALS                                                          │
│  │ Carbs:  ████████████████░░░░░░░░░░░░  720g / 1080g (67%)       │   │
│  │ Fluid:  ██████████████████░░░░░░░░░░  8500ml / 10000ml (85%)   │   │
│  │ Sodium: ████████████████████░░░░░░░░  5400mg / 7200mg (75%)    │   │
│                                                                          │
│  ⚠️ Hour 6-8: Carb intake below target. Consider adding gels.          │
│  ✓ Good glucose:fructose ratio in hours 1-4                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Timeline Row Component

Each hour row shows:
- Hour number and time range
- Corresponding course segment or checkpoint
- Drop zone for products (can hold multiple)
- Running totals for that hour (carbs, calories, sodium)
- Visual indicator: green/yellow/red based on targets
- Source indicator: 🚴 On-bike | 📦 Drop bag | 🏁 Aid station | 👋 Crew

### Aid Station Integration

When an aid station falls within an hour:
- Show a special "Aid Station" row/card
- Display: station name, mile marker, available supplies
- Flags: has_drop_bags, has_crew_access
- Separate drop zone: "What you're picking up here"
- Water refill input

### Product Card (Draggable)

```tsx
<ProductCard>
  <ProductImage src={product.imageUrl} />
  <ProductInfo>
    <Brand>{product.brand}</Brand>
    <Name>{product.name}</Name>
    <Macros>
      {product.carbsGrams}g • {product.calories} cal • {product.sodiumMg}mg
    </Macros>
    {product.glucoseFructoseRatio && (
      <Badge variant={isGoodRatio(product) ? 'success' : 'warning'}>
        {product.glucoseFructoseRatio}
      </Badge>
    )}
    {product.caffeineMg && <Badge>☕ {product.caffeineMg}mg</Badge>}
  </ProductInfo>
</ProductCard>
```

### Real-time Validation & Warnings

**Per-hour warnings:**
- "Below carb target" (yellow) or "Way below" (red)
- "Above recommended carbs without glucose:fructose mix" 
- "No sodium in this hour"
- "Caffeine late in race" (if after hour 8)

**Overall warnings:**
- "Total carbs X% below target"
- "Consider adding electrolytes - sodium is low"
- "Hours 5-7 are carb-heavy, hours 8-10 are light"

**Positive feedback:**
- "Great glucose:fructose balance ✓"
- "Hitting your targets ✓"

---

## PART 4: NUTRITION SOURCE TRACKING

### Where is each product coming from?

For each product, user selects source:
- **On-Bike Start**: Carrying from the start line
- **Drop Bag**: Picking up at drop bag station (select which)
- **Aid Station**: Getting from aid station supplies
- **Crew Handoff**: Getting from crew (select which point)

### Auto-Generated Packing Lists

**On-Bike Start Packing:**
- 4x Maurten Gel 100
- 2x Clif Bloks
- Total: 180g carbs, 720 cal

**Drop Bag: Pipeline (Mile 24):**
- 3x Maurten Gel 100
- 2x GU Roctane

**Crew Handoff: Outward Bound (Mile 60):**
- ...

---

## PART 5: EXPORTS

### Top Tube Sticker

Compact nutrition-focused format:
```
HOUR | FUEL                  | CARBS | NOTES
─────┼───────────────────────┼───────┼────────────
1    | Gel + Chew            | 75g   | 
2    | Gel + Gel             | 50g   | 
3    | Bar + Drink           | 80g   | Aid: refill
```

### Full Nutrition Plan PDF

- Summary targets and totals
- Hour-by-hour breakdown
- Packing lists by source
- Aid station checklist

### Garmin Sync

- "EAT" reminder every 20-30 minutes
- Can show: "Hour 3: Gel + Chews"

---

## PART 6: AI INTEGRATION (OPTIONAL)

### AI Nutrition Coach

Add AI assistant that can:

1. **Review the plan:**
   "Review my nutrition plan" → AI analyzes and gives feedback

2. **Suggest products:**
   "I need more sodium but don't want calories" → Suggests electrolyte tabs

3. **Answer questions:**
   "Is 100g carbs/hour too much?" → Explains gut training, limits

Use Claude API with sports nutrition system prompt. Keep grounded - no medical advice.

---

## PART 7: COMPONENT STRUCTURE

```
components/nutrition/
  NutritionPlanner.tsx              # Main page orchestrator
  
  # Targets & Summary
  NutritionTargets.tsx              # Calculated targets display
  NutritionTargetsSettings.tsx      # Adjust inputs
  NutritionTotalsSummary.tsx        # Progress bars
  
  # Product Palette
  ProductPalette.tsx                # Sidebar with products
  ProductCard.tsx                   # Draggable card
  ProductFilters.tsx                # Category filters
  ProductSearch.tsx                 # Search
  AddCustomProduct.tsx              # User's custom products
  
  # Timeline Builder  
  NutritionTimeline.tsx             # Main container
  TimelineHourRow.tsx               # Hour drop zone
  TimelineAidStation.tsx            # Aid station row
  TimelineProductChip.tsx           # Product in timeline
  TimelineElevationProfile.tsx      # Course visualization
  
  # Source & Packing
  ProductSourceSelector.tsx         # Source picker
  PackingListGenerator.tsx          # Auto packing lists
  
  # Validation
  NutritionWarnings.tsx             # Real-time warnings
  HourlyTargetIndicator.tsx         # Green/yellow/red
  
  # Export
  NutritionPDFExport.tsx
  NutritionStickerExport.tsx
  
  # AI
  NutritionAICoach.tsx              # Chat interface

lib/calculations/
  nutritionScience.ts               # Formulas
  nutritionValidation.ts            # Warnings

hooks/
  useNutritionPlan.ts               # State management
  useNutritionTargets.ts            # Calculate targets
  useProductSearch.ts               # Search/filter
```

---

## PART 8: DATABASE TABLES

```sql
-- Nutrition products (global)
CREATE TABLE nutrition_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  
  serving_size TEXT,
  calories INTEGER NOT NULL,
  carbs_grams DECIMAL NOT NULL,
  sodium_mg INTEGER NOT NULL,
  
  sugars_grams DECIMAL,
  glucose_grams DECIMAL,
  fructose_grams DECIMAL,
  maltodextrin_grams DECIMAL,
  glucose_fructose_ratio TEXT,
  
  caffeine_mg INTEGER,
  protein_grams DECIMAL,
  fat_grams DECIMAL,
  fiber_grams DECIMAL,
  
  water_content_ml INTEGER,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's custom products
CREATE TABLE user_nutrition_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  calories INTEGER NOT NULL,
  carbs_grams DECIMAL NOT NULL,
  sodium_mg INTEGER NOT NULL,
  -- ... same fields
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites
CREATE TABLE user_favorite_products (
  user_id UUID REFERENCES auth.users,
  product_id UUID REFERENCES nutrition_products,
  PRIMARY KEY (user_id, product_id)
);

-- Race nutrition plan
CREATE TABLE race_nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_plan_id UUID REFERENCES race_plans NOT NULL,
  
  hourly_carbs_target INTEGER,
  hourly_fluid_target INTEGER,
  hourly_sodium_target INTEGER,
  
  temperature_f INTEGER,
  humidity INTEGER,
  adjusted_for_weather BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items in the plan
CREATE TABLE race_nutrition_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id UUID REFERENCES race_nutrition_plans NOT NULL,
  
  product_id UUID REFERENCES nutrition_products,
  custom_product_id UUID REFERENCES user_nutrition_products,
  
  hour_number INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  
  source TEXT NOT NULL, -- on_bike, drop_bag, aid_station, crew
  source_location_id UUID,
  
  notes TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water per hour
CREATE TABLE race_nutrition_plan_water (
  nutrition_plan_id UUID REFERENCES race_nutrition_plans,
  hour_number INTEGER NOT NULL,
  water_ml INTEGER NOT NULL,
  source TEXT,
  PRIMARY KEY (nutrition_plan_id, hour_number)
);
```

---

## TECHNICAL REQUIREMENTS

- Use @dnd-kit/core and @dnd-kit/sortable for drag-drop
- Use Recharts for progress bars/charts
- Mobile: Stack layout, palette becomes bottom sheet
- Optimistic updates for smooth UX
- Auto-save as user makes changes
- Keep components under 400 lines
- Follow OWASP and WCAG from CLAUDE.md

---

## DESIGN PRIORITY

This is a flagship feature - make it beautiful:

- Clean layout with clear hierarchy
- Product cards should feel tactile/draggable
- Timeline feels like a planning canvas
- Progress bars animate smoothly
- Color coding: green (on target), yellow (warning), red (danger)
- Aid stations visually break up timeline
- Elevation profile adds context
- Empty states should be inviting
