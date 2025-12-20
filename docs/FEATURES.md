# RacePace Feature Specification

## MVP Features (Target: Mid South Gravel - March 2025)

### Core Platform
- [ ] Marketing site with signup
- [ ] Member portal: race selection, plan builder
- [ ] Athlete profile (weight, FTP, nutrition targets)
- [ ] Checkpoint/segment planning with pacing, nutrition, effort guidance
- [ ] Top tube sticker export (simple table format)
- [ ] PDF export of full plan
- [ ] Mobile-responsive race-day view
- [ ] Stripe integration for $20/year membership
- [ ] Account management (cancel, update payment)

### Race Pages
- [ ] Race overview: distance, elevation profile, dates, location
- [ ] Course composition (dirt %, pavement %, singletrack %)
- [ ] GPX download
- [ ] Aid station info and cutoff times
- [ ] Registered platform users count
- [ ] Community tab: other users' public profiles and gear choices
- [ ] Race forum for discussion

### User Profiles
- [ ] Public/private toggle (default private)
- [ ] If public: display name, gear choices, goal time (optional)
- [ ] Private users don't appear in race community views or forums

### Admin Portal
- [ ] Race management (add/edit races, upload GPX, set checkpoints, aid station info)
- [ ] User management (view members, subscription status)
- [ ] Forum moderation tools
- [ ] Support tools

### Race-Day Gear
- [ ] Packing checklist by category (on-bike, drop bag, race morning, crew)
- [ ] Item location tagging
- [ ] Pack status tracking
- [ ] Race-specific templates

### Gear Database
- [ ] Structured bike input (brand, model, year)
- [ ] Structured tire input (brand, model, width)
- [ ] Repair kit contents
- [ ] Privacy controls (default private, opt-in to anonymous aggregation)
- [ ] Aggregated insights per race

### Coach Features
- [ ] Coach tiers: Starter ($100/10), Pro ($250/50), Unlimited ($500)
- [ ] Coach dashboard with athlete list
- [ ] Invite athletes via email
- [ ] Create/edit plans for athletes
- [ ] Athletes can edit: FTP, weight, gear, checklist
- [ ] Athletes view-only: power targets, pace targets (coach controls)
- [ ] Notifications when athlete updates FTP/weight

---

## Post-MVP Features

### Exports
- [ ] Elevation profile sticker export
- [ ] Custom sticker designer

### Device Integration
- [ ] Garmin Connect IQ data field with membership auth
- [ ] Hammerhead app integration

### Advanced Features
- [ ] Coach/athlete sharing (separate tier)
- [ ] Post-race analysis (plan vs. actual via Strava/Garmin import)
- [ ] Training load integration
- [ ] Weather-adjusted recommendations
- [ ] Affiliate links for gear recommendations

### Running Expansion
- [ ] Trail running races (Western States, UTMB, etc.)
- [ ] Running-specific metrics (pace vs power)
- [ ] Arm sleeve / bib card exports (equivalent to top tube sticker)

---

## Initial Race Library

### Gravel
- [ ] Mid South Gravel (all distances)
- [ ] SBT Gravel (all distances)
- [ ] Unbound (all distances)
- [ ] Sea Otter Gravel
- [ ] Big Sugar
- [ ] Gravel Nationals (all distances)

### Mountain Bike
- [ ] Leadville 100 MTB
- [ ] Chequamegon 40

### Road/Mixed
- [ ] Triple Bypass (and Double Bypass)

---

## Pricing Structure

### Individual
- $20/year - Full platform access

### Coach Tiers
| Tier | Price | Athletes |
|------|-------|----------|
| Starter | $100/year | Up to 10 |
| Pro | $250/year | Up to 50 |
| Unlimited | $500/year | Unlimited |

### Coached Athletes
- $0 - Invited by coach, full access
- If coach relationship ends, can convert to individual paid plan
