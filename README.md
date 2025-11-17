# SwiftRoute - B2B Route Optimization API Platform

A production-ready B2B SaaS platform providing GNN-enhanced route optimization APIs with subscription-based billing.

## Features

- 🔐 **Secure Authentication** - Supabase-powered user management
- 🔑 **API Key Management** - Generate, view, and revoke API keys
- 📊 **Usage Analytics** - Real-time tracking and detailed reports
- 💳 **Stripe Billing** - Subscription management with tiered pricing
- 🚀 **Route Optimization** - GNN-enhanced routing algorithms
- 📈 **Rate Limiting** - Tier-based request limits
- 👤 **Profile Management** - User account settings

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Vercel Serverless Functions + Python FastAPI
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+
- Supabase account
- Stripe account
- Vercel account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

### Deployment

```bash
vercel --prod
```

See `docs/DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Project Structure

```
swift_route/
├── api/                    # Serverless API functions
│   ├── v1/
│   │   ├── billing/       # Billing endpoints
│   │   ├── keys/          # API key management
│   │   ├── optimize-route/# Route optimization (Python)
│   │   └── health.ts      # Health check
│   └── lib/               # Shared utilities
├── src/                   # Frontend React app
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   └── integrations/     # External integrations
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── supabase/            # Database migrations
```

## Subscription Tiers

| Tier | Price | Requests/Month | Rate Limit | Overage Cost |
|------|-------|----------------|------------|--------------|
| **Starter** | $29/mo | 1,000 | 10/min | $0.01/req |
| **Professional** | $199/mo | 10,000 | 50/min | $0.008/req |
| **Enterprise** | $999/mo | 100,000 | 200/min | $0.005/req |

## Documentation

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Stripe Setup](docs/STRIPE_SETUP_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)

## Scripts

- `cleanup-vercel-envs.ps1` - Remove preview/dev environments
- `add-stripe-prices-prod-only.ps1` - Add Stripe Price IDs to production

## Environment Variables

See `.env.example` for required environment variables.

Key variables:
- Supabase credentials
- Stripe API keys
- Stripe Price IDs
- Database connection string

## Testing

### Stripe Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

Use any future expiry, any CVC, any ZIP.

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact support or check the documentation in the `docs/` folder.
