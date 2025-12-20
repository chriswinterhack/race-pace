# RacePace

Race planning platform for endurance athletes. Build personalized race execution plans with pacing, nutrition, and gear management.

## Features

- **Race Plan Builder** - Create checkpoint-by-checkpoint race strategies
- **Personalized Pacing** - Power and pace targets based on your FTP and goals
- **Nutrition Planning** - Carb, hydration, and sodium targets per segment
- **Gear Management** - Track bike setup and packing checklists
- **Top Tube Stickers** - Export printable race-day reference cards
- **Community** - See what gear others are using, discuss race strategies

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/[your-username]/racepace.git
cd racepace

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utilities and helpers
├── types/               # TypeScript definitions
└── hooks/               # Custom React hooks
```

## Development

```bash
# Run development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build for production
npm run build
```

## Design

- **Colors:** Navy Blue (#1e3a5f) and Sky Blue (#0ea5e9)
- **Accessibility:** WCAG 2.2 AA compliant
- **Security:** OWASP Top 10 compliant
- **Responsive:** Mobile-first, optimized for all devices

## License

Proprietary - All rights reserved
