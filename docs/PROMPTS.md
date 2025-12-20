# RacePace - Claude Code Prompts

Use these prompts when working with Claude Code to build out features.

**Before starting any feature, remind Claude Code:**
- Read CLAUDE.md for full project context
- Follow OWASP Top 10 security practices
- Ensure WCAG 2.2 AA accessibility compliance
- Keep all files under 400 lines - break into smaller pieces
- Use navy blue (#1e3a5f) and sky blue (#0ea5e9) color palette
- Build for both mobile and desktop
- Use open source libraries from the recommended list
- Act as a world-leading UI/UX expert - make it sleek and modern

---

## Initial Project Setup

```
Set up a new Next.js 14 project with TypeScript, Tailwind CSS, and the App Router. 

Read CLAUDE.md first for full project context including:
- Color palette (navy blue #1e3a5f, sky blue #0ea5e9)
- Security requirements (OWASP Top 10)
- Accessibility requirements (WCAG 2.2 AA)
- Code style (files under 400 lines)

Include:
- Strict TypeScript configuration
- Tailwind with custom color palette from CLAUDE.md
- ESLint and Prettier
- Path aliases (@/ for src/)
- shadcn/ui setup

Create the initial folder structure per CLAUDE.md.
```

---

## Database Setup

```
Create Supabase migrations for the core data models:
- users (extends Supabase auth.users)
- athlete_profiles
- races
- race_plans
- segments
- gear_setups
- packing_checklists
- forum_posts
- forum_replies

Include:
- Proper foreign keys and indexes
- Row Level Security (RLS) policies following OWASP guidelines
- Appropriate constraints and defaults

Reference CLAUDE.md for the schema details.
```

---

## Authentication

```
Implement authentication with Supabase Auth following OWASP security guidelines:
- Sign up with email/password (with strong password requirements)
- Login with rate limiting
- Password reset
- OAuth with Google
- Protected routes middleware
- Auth context provider
- Secure session handling

Create accessible auth pages (WCAG 2.2 AA): /login, /signup, /forgot-password

Use the navy/sky blue color palette. Make it modern and sleek.
```

---

## Marketing Site

```
Build the marketing homepage as a world-class SaaS landing page.

Include:
- Hero section with clear value proposition
- Feature highlights (plan builder, stickers, community)
- Pricing section ($20/year individual, coach tiers)
- Social proof section (placeholder for testimonials)
- CTA to sign up
- Footer with links

Requirements:
- Ultra-modern, sleek design (act as world-leading UI/UX expert)
- Navy blue (#1e3a5f) and sky blue (#0ea5e9) palette
- Mobile-first, responsive design
- WCAG 2.2 AA accessible
- Smooth animations (Framer Motion, use sparingly)
- Keep components under 400 lines each
```

---

## Athlete Dashboard

```
Create the main athlete dashboard at /dashboard.

Include:
- Overview of upcoming races with plans
- Quick stats (profile completeness, plans created)
- Recent activity
- Navigation to: My Plans, My Gear, Profile, Settings

Requirements:
- Responsive sidebar layout (collapses to bottom nav on mobile)
- Clean data visualization
- Skeleton loaders for async content
- WCAG 2.2 AA accessible
- Navy/sky blue color palette
- Keep each component file under 400 lines
```

---

## Race Selection

```
Build the race selection page at /races.

Include:
- Grid of available races with images
- Filter by type (gravel, MTB, running) and date
- Search functionality
- Each card shows: name, date, location, distances available
- Click to view race detail page

Race detail page shows:
- Full race info with hero image
- Interactive elevation profile (Recharts)
- GPX download button
- Aid station information
- Community tab showing other athletes' gear
- Forum section
- "Create Plan" CTA

Requirements:
- Beautiful card design with hover states
- Smooth filtering/search
- Mobile-optimized grid (1 col mobile, 2 col tablet, 3 col desktop)
- WCAG 2.2 AA accessible
- Keep files under 400 lines
```

---

## Plan Builder

```
Create the race plan builder at /plans/new.

This is a core feature - make it exceptional.

Steps:
1. Race selection (if not already selected)
2. Goal time input with time picker
3. Auto-calculated pacing table based on athlete profile
4. Segment-by-segment editor:
   - Effort level selector (safe/tempo/pushing)
   - Nutrition notes
   - Strategy notes
   - Visual segment preview
5. Save draft / Complete plan
6. Export options (sticker, PDF)

Requirements:
- Intuitive multi-step wizard interface
- Real-time pacing calculations (formulas in CLAUDE.md)
- Autosave draft functionality
- Mobile-friendly segment editing
- Clear visual feedback
- WCAG 2.2 AA accessible (keyboard navigation for all steps)
- Keep each component under 400 lines
- Extract calculation logic to lib/calculations/
```

---

## Top Tube Sticker Export

```
Build the sticker export feature using @react-pdf/renderer.

Options:
- Simple table format: checkpoint | mile | target time
- Customizable header text ("11 Hours or Bust!")
- Size options: standard, compact, extended
- Mode options: Pacing Only, Full Plan (with nutrition)

Output:
- PDF sized for printing (2" x 8-10")
- Print instructions page with weatherproofing tips

Requirements:
- Live preview before export
- Clean, readable typography
- High contrast for outdoor readability
- Keep components under 400 lines
```

---

## Gear Tracking

```
Build the gear management pages:
- /gear - list all gear setups by race
- /gear/new - add gear for a race

Features:
- Structured inputs for: bike (brand/model/year), tires (brand/model/width)
- Repair kit contents (searchable multi-select)
- Privacy toggle (public for aggregation or private)
- Photo upload for bike

Community features:
- Aggregated data: "73% of Leadville riders used 40mm+ tires"
- Visual charts showing popular choices

Requirements:
- Beautiful form design with smart defaults
- Auto-complete for common brands/models
- Mobile-optimized input
- WCAG 2.2 AA accessible
- Keep files under 400 lines
```

---

## Packing Checklist

```
Build the packing checklist feature.

Features:
- Pre-populated template based on race (drop bags for Leadville, etc.)
- Categories: on_bike, drop_bag, race_morning, crew, jersey_pocket
- Add/remove/reorder items
- Mark packed status with satisfying checkbox animation
- Item location assignment
- Save per race
- Print-friendly view

Requirements:
- Drag-and-drop reordering (accessible alternative for keyboard)
- Progress indicator showing % packed
- Swipe to delete on mobile
- WCAG 2.2 AA accessible
- Keep files under 400 lines
```

---

## Coach Portal

```
Build the coach dashboard at /coach.

Features:
- List of athletes with status indicators
- Invite new athlete (email invite flow)
- Click athlete to view/edit their plans
- Notification badges for athletes who updated FTP/weight
- Bulk actions (export all plans, etc.)

Permissions:
- Coach can edit power/pace targets
- Athlete data (FTP, weight, gear) is view-only for coach

Requirements:
- Professional dashboard design
- Quick-action buttons
- Responsive data table (TanStack Table)
- WCAG 2.2 AA accessible
- Keep files under 400 lines
```

---

## Admin Portal

```
Build the admin portal at /admin.

Features:
- Race management: add/edit races, upload GPX, set aid stations/cutoffs
- User management: view all users, subscription status, role
- Forum moderation: flag/remove posts
- Basic analytics: total users, plans created, popular races
- Support tools: impersonate user (with audit logging)

Requirements:
- Clean admin UI with clear navigation
- Secure routes (verify admin role)
- Audit logging for sensitive actions
- WCAG 2.2 AA accessible
- Keep files under 400 lines
```

---

## Stripe Integration

```
Implement Stripe subscriptions following OWASP security guidelines.

Plans:
- Individual: $20/year
- Coach Starter: $100/year (10 athletes)
- Coach Pro: $250/year (50 athletes)
- Coach Unlimited: $500/year

Features:
- Checkout flow with Stripe Elements
- Customer portal for managing subscription
- Webhook handler for subscription events
- Middleware to check subscription status
- Grace period handling
- Failed payment notifications

Requirements:
- Secure webhook validation
- Proper error handling
- Test mode support
- Keep files under 400 lines
```

---

## Dev Mode Toggle

```
Add a development-only role switcher component.

Features:
- Floating button in corner (dev/staging only)
- Dropdown to switch between: Admin, Coach, Athlete
- Persists selection in localStorage
- Completely hidden in production

Implementation:
- Use NODE_ENV to control visibility
- Style consistently with app design
- Keep file under 100 lines
```

---

## Notifications

```
Implement the notification system.

Features:
- In-app notifications (bell icon with badge)
- Email notifications via Resend
- Triggers: coached athlete updates FTP/weight
- Notification preferences in settings
- Mark as read / mark all read
- Notification history

Requirements:
- Real-time updates (Supabase realtime or polling)
- Accessible notification panel
- Mobile-friendly slide-out panel
- Keep files under 400 lines
```
