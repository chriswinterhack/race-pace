# FinalClimb

> **CRITICAL - BRAND NAME & DOMAIN:**
> - Business name: **FinalClimb**
> - Domain: **thefinalclimb.com**
> - The folder is named "racepace" for historical reasons only - IGNORE IT
> - **NEVER use "RacePace" anywhere - that name was taken**
> - **NEVER use "finalclimb.com" - we don't own that domain**
> - Always use "FinalClimb" for the brand and "thefinalclimb.com" for URLs

## Project Overview

FinalClimb is a race planning platform for cyclists (gravel, road, MTB, cyclocross). Athletes and coaches use it to build personalized race execution plans with pacing, nutrition, gear management, and checkpoint strategies.

**Target Launch:** Mid South Gravel (March 14-15, 2025)

## Core Value Proposition

- Athletes input their profile (FTP, weight, nutrition targets) and select a race
- System generates personalized pacing, power targets, and nutrition plans
- Outputs include top tube stickers, PDF race plans, and Garmin data fields
- Community features: gear sharing, race forums, athlete profiles

## Design Philosophy

**Act as a world-leading UI/UX expert.** Build an ultra-modern, sleek SaaS product that feels premium and professional—think Linear, Vercel Dashboard, or Stripe quality. The interface should be clean, fast, and delightful to use.

**IMPORTANT:** When building UI components, pages, or interfaces, reference the frontend-design skill at `/mnt/skills/public/frontend-design/SKILL.md` for creative direction and implementation guidance.

### Design Principles
- **Refined & Premium:** Luxury SaaS aesthetic with purposeful whitespace and clear hierarchy
- **Fast & Responsive:** Optimize for performance, skeleton loaders, optimistic updates
- **Mobile-First:** Design for mobile, enhance for desktop
- **Accessible:** WCAG 2.2 AA compliant (see Accessibility section)
- **Consistent:** Unified design language across all pages
- **Memorable:** Distinctive visual identity that stands out from generic SaaS

### Color Palette

Navy and sky blue are the brand colors. Use this expanded palette:

```typescript
// tailwind.config.ts - Add to theme.extend.colors
brand: {
  navy: {
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581',
    700: '#334e68',
    800: '#243b53',
    900: '#102a43',  // Primary navy - headers, nav, dark backgrounds
    950: '#0a1929',  // Extra dark for contrast
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',  // Primary sky - buttons, links, accents
    500: '#0ea5e9',  // Hover states
    600: '#0284c7',  // Active states
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  }
}
```

| Role | Color | Usage |
|------|-------|-------|
| Primary Actions | Sky 400-600 | Buttons, links, progress bars |
| Navigation/Headers | Navy 900 | Sidebar, top nav, headings |
| Backgrounds | White, Navy 50 | Page backgrounds, cards |
| Text Primary | Navy 900 | Headings, important text |
| Text Secondary | Navy 600 | Body text, descriptions |
| Borders | Navy 200 | Card borders, dividers |
| Success | #22c55e | Success states, completed |
| Warning | #f59e0b | Warnings, cautions |
| Error | #ef4444 | Errors, destructive actions |

### Typography
- **Headings:** Plus Jakarta Sans (distinctive, modern) or Inter
- **Body:** Inter (clean, readable)
- **Data/Numbers:** JetBrains Mono or Tabular Nums (for pacing tables, power numbers)

### Visual Details
- Subtle shadows for depth (not flat, not heavy)
- Rounded corners (8-12px for cards, 6px for buttons)
- Micro-interactions on hover/focus
- Gradient accents (navy to sky) used sparingly
- Loading skeletons that match content shape

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ with TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API routes |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Payments | Stripe (subscriptions) |
| File Storage | Supabase Storage |
| Hosting | Vercel |
| Email | Resend |

## Security Requirements (OWASP Top 10)

Follow OWASP Top 10 security practices:

1. **Broken Access Control**
   - Implement proper RLS policies in Supabase
   - Verify user permissions on every API route
   - Use middleware for route protection

2. **Cryptographic Failures**
   - Never store sensitive data in plain text
   - Use HTTPS everywhere (Vercel handles this)
   - Encrypt sensitive fields at rest

3. **Injection**
   - Use parameterized queries (Supabase client handles this)
   - Validate and sanitize all user inputs with Zod
   - Never interpolate user input into queries

4. **Insecure Design**
   - Implement rate limiting on API routes
   - Use CSRF protection
   - Validate on both client and server

5. **Security Misconfiguration**
   - Keep dependencies updated
   - Use environment variables for secrets
   - Disable verbose error messages in production

6. **Vulnerable Components**
   - Audit dependencies regularly (npm audit)
   - Use only well-maintained open source libraries
   - Pin dependency versions

7. **Authentication Failures**
   - Use Supabase Auth (handles secure session management)
   - Implement proper password requirements
   - Add rate limiting to auth endpoints

8. **Data Integrity Failures**
   - Validate all data on the server
   - Use TypeScript strict mode
   - Implement proper error handling

9. **Security Logging**
   - Log authentication events
   - Log failed access attempts
   - Never log sensitive data

10. **Server-Side Request Forgery**
    - Validate and sanitize URLs
    - Use allowlists for external requests
    - Don't expose internal services

## Accessibility (WCAG 2.2 AA)

All features must be WCAG 2.2 AA compliant:

### Perceivable
- All images have meaningful alt text
- Color contrast ratio minimum 4.5:1 for text
- Don't rely on color alone to convey information
- Provide text alternatives for non-text content

### Operable
- All functionality available via keyboard
- No keyboard traps
- Skip links for main content
- Focus indicators visible on all interactive elements
- Touch targets minimum 44x44px on mobile

### Understandable
- Consistent navigation across pages
- Clear error messages with recovery suggestions
- Labels on all form inputs
- Predictable behavior

### Robust
- Valid HTML
- ARIA labels where needed
- Works with screen readers
- Test with axe-core or similar

### Implementation
```typescript
// Use these patterns:
<button aria-label="Close modal" />
<input aria-describedby="error-message" />
<nav aria-label="Main navigation" />
<main id="main-content" />
<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>
```

## Responsive Design

**Optimize for both desktop and mobile.** Use mobile-first approach.

### Breakpoints (Tailwind defaults)
| Name | Min Width | Target |
|------|-----------|--------|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

### Mobile Considerations
- Bottom navigation for primary actions
- Swipe gestures where appropriate
- Collapsible sections for dense content
- Touch-friendly tap targets (min 44px)
- No hover-only interactions

### Desktop Enhancements
- Sidebar navigation
- Multi-column layouts
- Keyboard shortcuts
- Hover states for additional info

## Project Structure

```
racepace/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (marketing)/        # Public marketing pages
│   │   ├── (auth)/             # Login, signup, password reset
│   │   ├── (dashboard)/        # Authenticated athlete/coach views
│   │   ├── (admin)/            # Admin portal
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # Reusable UI components (buttons, inputs, cards)
│   │   ├── layout/             # Layout components (header, sidebar, footer)
│   │   ├── forms/              # Form components
│   │   ├── race/               # Race-specific components
│   │   ├── plan/               # Plan builder components
│   │   └── exports/            # Sticker/PDF generation
│   ├── lib/
│   │   ├── supabase/           # Supabase client & helpers
│   │   ├── stripe/             # Stripe integration
│   │   ├── calculations/       # Pacing, power, nutrition math
│   │   ├── validations/        # Zod schemas
│   │   └── utils/              # General utilities
│   ├── types/                  # TypeScript type definitions
│   ├── hooks/                  # Custom React hooks
│   └── styles/                 # Global styles, Tailwind config
├── public/
│   └── assets/                 # Static assets
├── supabase/
│   └── migrations/             # Database migrations
└── docs/                       # Project documentation
```

## Code Style Guidelines

### File Size Limit
**Keep all files under 400 lines of code.** Break features into smaller, focused pieces.

If a file approaches 400 lines:
- Extract reusable logic into custom hooks
- Split large components into smaller sub-components
- Move business logic to lib/ functions
- Create separate files for types/interfaces

### Component Organization
```typescript
// Good: Small, focused components
// components/plan/PlanBuilder.tsx (~100 lines) - orchestrates
// components/plan/SegmentList.tsx (~80 lines) - displays segments
// components/plan/SegmentEditor.tsx (~120 lines) - edits single segment
// components/plan/PacingTable.tsx (~60 lines) - shows pacing data

// Bad: One massive component
// components/plan/PlanBuilder.tsx (600+ lines) - does everything
```

### General Guidelines
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind for all styling (no separate CSS files)
- API routes return consistent response format: `{ data, error }`
- Use Zod for runtime validation (client and server)
- Prefer server components where possible (Next.js App Router)
- Keep components small and focused
- Extract business logic to lib/ functions
- Use open source libraries where possible (see Recommended Libraries)

### Naming Conventions
```typescript
// Components: PascalCase
export function RacePlanCard() {}

// Hooks: camelCase with 'use' prefix
export function useRacePlan() {}

// Utilities: camelCase
export function calculatePacing() {}

// Types: PascalCase
type RacePlan = {}
interface AthleteProfile {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_SEGMENTS = 50
```

## Clean Code Guidelines

Follow these principles to maintain code quality and long-term maintainability.

### General Rules
1. **Follow standard conventions** - Use established patterns from this document
2. **Keep it simple** - Simpler is always better; reduce complexity
3. **Boy Scout Rule** - Leave the codebase cleaner than you found it
4. **Find root cause** - Always look for the root cause of a problem, not just symptoms

### No Code Duplication (DRY)
**Never duplicate utility functions.** Always import from shared locations:

```typescript
// ✅ CORRECT: Import from shared utilities
import { parseLocalDate, formatDateRange } from "@/lib/utils/date";
import { haversineDistance } from "@/lib/utils/geo";
import { generateGradient } from "@/lib/utils/ui";
import { formatDistance, formatElevation } from "@/lib/utils/units";

// ❌ WRONG: Defining utilities locally in components
function parseLocalDate(dateStr: string): Date {
  // This should be imported, not redefined!
}
```

**Shared utility locations:**
| Utility | Location | Purpose |
|---------|----------|---------|
| `parseLocalDate` | `@/lib/utils/date` | Timezone-safe date parsing |
| `formatDateRange` | `@/lib/utils/date` | Date range formatting |
| `haversineDistance` | `@/lib/utils/geo` | GPS distance calculation |
| `generateGradient` | `@/lib/utils/ui` | Consistent gradient generation |
| `formatDistance` | `@/lib/utils/units` | Unit-aware distance formatting |
| `formatElevation` | `@/lib/utils/units` | Unit-aware elevation formatting |

### Named Constants (No Magic Numbers)
**Replace all magic numbers with named constants:**

```typescript
// ✅ CORRECT: Named constants in lib/constants/
export const CONVERSION = {
  KM_TO_MILES: 0.621371,
  METERS_TO_FEET: 3.28084,
  MILES_TO_FEET: 5280,
  MPS_TO_MPH: 2.237,
} as const;

export const GRADE_THRESHOLDS = {
  CLIMBING: 2.0,    // >= 2% is climbing
  FLAT_MIN: -2.0,   // -2% to 2% is flat
  STEEP_CLIMB: 8.0, // >= 8% is steep
} as const;

export const TIME_THRESHOLDS = {
  SHORT_RACE_MINUTES: 240,  // 4 hours
  LONG_RACE_MINUTES: 480,   // 8 hours
} as const;

// ❌ WRONG: Magic numbers inline
const grade = elevationFt * 3.28084;  // What is 3.28084?
if (movingTimeMinutes < 240) { ... }  // Why 240?
```

### Function Rules
1. **Small** - Functions should be short (ideally < 20 lines)
2. **Do one thing** - Each function has a single responsibility
3. **Descriptive names** - Name should describe what it does
4. **Few arguments** - Prefer 0-2 arguments; use objects for more
5. **No side effects** - Functions should be predictable
6. **No flag arguments** - Split into separate functions instead

```typescript
// ✅ CORRECT: Small, focused functions
function calculateClimbingPower(ftp: number, grade: number): number {
  return ftp * getClimbingMultiplier(grade);
}

function calculateFlatPower(ftp: number): number {
  return ftp * POWER_MULTIPLIERS.FLAT;
}

// ❌ WRONG: Flag argument
function calculatePower(ftp: number, isClimbing: boolean): number {
  if (isClimbing) { ... } else { ... }
}
```

### Component Structure
Components should follow single responsibility:

```typescript
// ✅ CORRECT: Split by concern
// GearSection/index.tsx - orchestrates
// GearSection/GearInventory.tsx - displays inventory
// GearSection/GearSelector.tsx - handles selection
// GearSection/CommunityGear.tsx - community features

// ❌ WRONG: Monolithic component with 800+ lines
// GearSection.tsx - does everything
```

### Understandability
1. **Be consistent** - Do similar things the same way everywhere
2. **Use explanatory variables** - Break complex expressions into named parts
3. **Encapsulate boundary conditions** - Handle edge cases in one place
4. **Avoid negative conditionals** - Prefer `if (isActive)` over `if (!isInactive)`

```typescript
// ✅ CORRECT: Explanatory variables
const isRaceUpcoming = raceDate >= today;
const hasValidProfile = profile?.ftp_watts && profile?.weight_kg;
const canGeneratePlan = isRaceUpcoming && hasValidProfile;

if (canGeneratePlan) { ... }

// ❌ WRONG: Complex inline condition
if (raceDate >= today && profile?.ftp_watts && profile?.weight_kg) { ... }
```

### Comments
1. **Explain yourself in code** - Good names > comments
2. **Don't be redundant** - Don't comment obvious code
3. **Use for intent** - Explain *why*, not *what*
4. **Use for warnings** - Document non-obvious consequences

```typescript
// ✅ CORRECT: Explains why
// Haversine formula accounts for Earth's curvature - required for accurate
// GPS distance over long courses where flat-earth math has >1% error
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number

// ❌ WRONG: States the obvious
// This function calculates distance
function calculateDistance() { ... }
```

### State Management
Minimize useState declarations per component:

```typescript
// ✅ CORRECT: Group related state or use reducer
const [formState, setFormState] = useState<FormState>({
  loading: false,
  saving: false,
  error: null,
});

// Or use useReducer for complex state
const [state, dispatch] = useReducer(gearReducer, initialState);

// ❌ WRONG: Many individual useState calls
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);
// ... 10 more useState calls
```

### Code Smells to Avoid
1. **Rigidity** - Small changes cascade into many file changes
2. **Fragility** - Changes break unrelated code
3. **Immobility** - Code can't be reused elsewhere
4. **Needless Complexity** - Over-engineering for hypothetical needs
5. **Needless Repetition** - Copy-pasted code (see DRY above)
6. **Opacity** - Code is hard to understand

## Recommended Open Source Libraries

| Purpose | Library | Notes |
|---------|---------|-------|
| UI Components | shadcn/ui | Copy-paste components, fully customizable |
| Icons | Lucide React | Consistent, accessible icons |
| Forms | React Hook Form | Performance, validation |
| Validation | Zod | Runtime type checking |
| Date/Time | date-fns | Lightweight date utilities |
| Charts | Recharts | For elevation profiles, analytics |
| PDF Generation | @react-pdf/renderer | Top tube stickers, race plans |
| Tables | TanStack Table | Sortable, filterable data tables |
| Toast/Notifications | Sonner | Elegant notifications |
| Animations | Framer Motion | Smooth transitions (use sparingly) |
| GPX Parsing | gpxparser | Parse GPX files |
| State Management | Zustand | If needed beyond React state |

## User Roles & Permissions

### Individual Athlete ($20/year)
- Full access to plan builder
- All races
- Community features (if profile public)
- Gear tracking
- Exports (stickers, PDF, GPX download)

### Coach Tiers
| Tier | Price/year | Athletes |
|------|-----------|----------|
| Starter | $100 | Up to 10 |
| Pro | $250 | Up to 50 |
| Unlimited | $500 | Unlimited |

### Coach Permissions
- Dashboard of all athletes
- Create/edit plans on behalf of athletes
- Invite athletes via email
- View athlete profiles, gear, checklists

### Coached Athlete (invited by coach, $0)
- **Can edit:** Profile (FTP, weight), gear, packing checklist, privacy settings
- **View only:** Power targets, pace targets, checkpoint times, effort guidance (coach controls)

### Admin
- Race management (add/edit races, upload GPX, checkpoints, aid stations)
- User management (view members, subscription status)
- Forum moderation
- Support tools

## Data Models

### User
- id, email, name, role (athlete | coach | admin)
- subscription_status, subscription_tier
- coach_id (if coached athlete)
- profile_public (boolean)
- created_at, updated_at

### AthleteProfile
- user_id
- weight_kg, ftp_watts
- altitude_adjustment_factor
- nutrition_cho_per_hour, hydration_ml_per_hour, sodium_mg_per_hour
- preferred_units (metric | imperial)

### Race
- id, name, slug
- date, location
- distances[] (multiple distance options per race)
- gpx_file_url
- total_elevation_gain
- elevation_low, elevation_high
- course_composition (dirt_pct, pavement_pct, singletrack_pct)
- aid_stations[] (mile, name, supplies, cutoff_time)
- is_active

### RacePlan
- id, user_id, race_id
- goal_time_minutes
- created_by (user_id - athlete or coach)
- segments[] (see Segment model)
- status (draft | complete)

### Segment
- race_plan_id
- start_mile, end_mile
- start_name, end_name
- target_time_minutes
- effort_level (safe | tempo | pushing)
- power_target_low, power_target_high
- nutrition_notes, hydration_notes
- terrain_notes, strategy_notes

### GearSetup
- user_id, race_id
- bike_brand, bike_model, bike_year
- tire_brand, tire_model, tire_width
- repair_kit_contents[]
- is_public (for community aggregation)

### PackingChecklist
- user_id, race_id
- items[] (name, category, location, quantity, packed)

Categories: on_bike, drop_bag, race_morning, crew, jersey_pocket

### ForumPost
- id, race_id, user_id
- title, body
- created_at, updated_at

### ForumReply
- post_id, user_id
- body
- created_at

## Key Calculations

### Altitude-Adjusted FTP
```typescript
altitudeAdjustedFTP = ftp * (1 - altitudeAdjustmentFactor)
// Default adjustment: 0.20 (20% reduction)
```

### Target Normalized Power
```typescript
// Intensity factors
const IF = { safe: 0.67, tempo: 0.70, pushing: 0.73 }
targetNP = altitudeAdjustedFTP * IF[effortLevel]
```

### Power by Terrain
```typescript
// Multipliers relative to race target
climbPower = targetNP * 1.20  // +20% on climbs
flatPower = targetNP * 0.90   // -10% on flats
```

### Energy Expenditure
```typescript
energyKJ = targetNP * raceTimeSeconds / 1000
caloriesBurned = energyKJ // roughly 1:1 ratio
```

### Nutrition Targets
```typescript
minCHOPerHour = caloriesPerHour * 0.20 / 4  // 20% replacement minimum
targetCHOPerHour = 90-120 // grams, athlete preference
hydrationPerHour = 750-1000 // ml, athlete preference
sodiumPerHour = 500-1000 // mg, athlete preference
```

## Feature Flags / Dev Mode

In development, include a role switcher UI:
```
[Dev Mode: Admin ▼]
- Admin
- Coach  
- Athlete
```

This should only be visible in development/staging environments. In production, role is determined by account type at login.

## Notifications

Coach receives notification (email + in-app) when their athlete updates:
- FTP
- Weight

Email template:
> "[Athlete Name] updated their FTP from [old]w to [new]w. Their current power targets for [Race] may need adjustment. [Review Plan]"

## Export Formats

### Top Tube Sticker
- Simple table format (MVP): checkpoint, mile, target time
- Future: elevation profile with overlaid checkpoints
- Sizes: standard, compact, extended (for varying top tube lengths)
- Two modes: Pacing Only, Full Plan (includes nutrition notes)
- Output: PDF sized for printing (roughly 2" x 8-10")

### PDF Race Plan
- Full formatted plan similar to coach-provided PDF
- Includes: athlete profile, race overview, pacing table, checkpoint schedule, nutrition plan, gear checklist

### GPX Download
- Original course GPX available for each race

## Initial Races

- Mid South Gravel (all distances)
- SBT Gravel (all distances)
- Unbound (all distances)
- Sea Otter Gravel
- Leadville 100 MTB
- Triple Bypass (and Double Bypass)
- Big Sugar
- Gravel Nationals (all distances)
- Chequamegon 40

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=development
```

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npm run typecheck

# Database migrations
npx supabase migration new <name>
npx supabase db push
```

## Current Status

Phase: Pre-development
Next milestone: MVP for Mid South Gravel (March 2025)
