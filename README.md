# SwiftRoute - AI-Powered Route Optimization for Sustainable Cities

**B2B SaaS Platform | UN SDG 11 Aligned | Production Ready**

SwiftRoute is a production-ready B2B API platform that provides intelligent route optimization services, helping logistics companies reduce costs by 20-30% while contributing to sustainable urban development (UN SDG 11).

---

## 🌍 Mission

Transform urban logistics through intelligent route optimization that reduces operational costs, lowers carbon emissions, and contributes to building sustainable, resilient cities aligned with UN Sustainable Development Goal 11.

## ✨ Key Features

### Core Capabilities
- 🚀 **Global Route Optimization** - OSRM-powered routing works anywhere in the world
- 🚗 **Multi-Vehicle Support** - Car, truck, van, motorcycle, bicycle routing
- 🔄 **Alternative Routes** - Multiple route options with trade-off analysis
- ⚡ **Real-Time Performance** - Sub-second API response times
- 📊 **Usage Analytics** - Comprehensive tracking and reporting

### Business Features
- 🔐 **Dual Authentication** - Bearer tokens (dashboard) + API keys (B2B)
- 💳 **Tiered Subscriptions** - Trial, Starter, Professional, Enterprise
- 📈 **Rate Limiting** - Tier-based request limits
- 🔑 **API Key Management** - Generate, monitor, and revoke keys
- 💰 **Stripe Integration** - Automated billing and payments

### Sustainability Impact
- 🌱 **CO₂ Tracking** - Real-time emissions calculations
- 📉 **Cost Reduction** - 20-30% operational savings
- 🎯 **SDG 11 Alignment** - Contributes to sustainable cities goals
- 📊 **Impact Reporting** - Quantifiable environmental benefits

---

## 🏗️ Architecture

### Technology Stack
- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Vercel Serverless (Node.js + Python)
- **Database:** Supabase (PostgreSQL + PostGIS)
- **Routing Engine:** OSRM (Open Source Routing Machine)
- **Payments:** Stripe
- **Deployment:** Vercel (Hobby Plan Compatible)

### System Design
```
User/Client
    ↓
Frontend Dashboard (React)
    ↓
API Gateway (Node.js)
    ↓
Route Optimizer (Python)
    ↓
OSRM External API
```

**Key Design Decisions:**
- Serverless architecture for scalability
- External OSRM API (no database maintenance)
- Dual authentication for flexibility
- Optimized for Vercel Hobby plan (<12 functions)

---

## 🚀 Quick Start

### For Developers

```bash
# Clone repository
git clone https://github.com/yourusername/swift_route.git
cd swift_route

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

### For API Users

1. **Sign Up:** Visit [SwiftRoute](https://swift-route-liard.vercel.app)
2. **Get API Key:** Dashboard → API Keys → Generate
3. **Make Request:**

```bash
curl -X POST https://swift-route-liard.vercel.app/api/v1/optimize-route \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "origin": [-1.2921, 36.8219],
    "destination": [-1.2864, 36.8172],
    "vehicle_type": "car",
    "optimize_for": "time"
  }'
```

---

## 💰 Pricing

| Tier | Price | Requests/Month | Rate Limit | Best For |
|------|-------|----------------|------------|----------|
| **Trial** | Free | 100 | 5/min | Testing |
| **Starter** | $29/mo | 1,000 | 10/min | Small fleets |
| **Professional** | $199/mo | 10,000 | 50/min | Growing businesses |
| **Enterprise** | $999/mo | 100,000 | 200/min | Large operations |

**Overage Pricing:** $0.01 - $0.005 per request depending on tier

---

## 📚 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get started in minutes
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Architecture](docs/ARCHITECTURE.md)** - System design and components
- **[Project Status](docs/PROJECT_STATUS.md)** - Current implementation status
- **[Investor Pitch](docs/INVESTOR_PITCH.md)** - Business case and impact

---

## 🌱 UN SDG 11 Impact

SwiftRoute directly contributes to two UN Sustainable Development Goal 11 targets:

### Target 11.2: Sustainable Transport
- **15-30% reduction** in operational costs through optimized routing
- **Accurate ETAs** even in data-scarce regions
- **Enhanced accessibility** by removing transit uncertainty

### Target 11.6: Environmental Impact
- **Verified CO₂ reduction** reports for every route
- **20%+ reduction** in fleet mileage and fuel consumption
- **Lower PM2.5 & PM10** emissions contributing to cleaner urban air

**Measurable Impact:**
- Every optimized route shows exact kg of CO₂ saved
- Tree seedling equivalents calculated for user understanding
- Aggregated impact reporting for corporate sustainability goals

---

## 🔧 Project Structure

```
swift_route/
├── api/
│   ├── index.js              # Unified API handler (Node.js)
│   └── v1/optimize-route/
│       └── main.py           # Route optimization (Python)
├── lib/
│   └── gnn/                  # Optimization modules
│       ├── network/          # OSRM client, transformers
│       ├── models/           # Vehicle profiles
│       └── optimizer/        # Optimization engine
├── src/
│   ├── components/           # React components
│   ├── pages/               # Dashboard, Auth, Landing
│   └── integrations/        # Supabase client
├── docs/                    # Documentation
└── supabase/
    └── migrations/          # Database schema
```

---

## 🚢 Deployment

**Production URL:** https://swift-route-liard.vercel.app

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Requirements:**
- Vercel account (Hobby plan sufficient)
- Supabase project
- Stripe account (for payments)

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🧪 Testing

### Test in Dashboard
1. Log into dashboard
2. Navigate to "Route Optimizer" tab
3. Enter coordinates and optimize

### Test via API
Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

---

## 📊 Current Status

**✅ Production Ready**
- All core features implemented
- Successfully deployed to Vercel
- API keys and usage tracking functional
- Stripe billing integrated
- Documentation complete

**Pending Enhancements:**
- Frontend geolocation service
- Amenity recommendations
- Real-time traffic integration
- Stripe webhook for auto-sync

See [Project Status](docs/PROJECT_STATUS.md) for details.

---

## 🤝 Contributing

This is a proprietary project. For collaboration inquiries, please contact the project owner.

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

- **Documentation:** [docs/](docs/)
- **Dashboard:** https://swift-route-liard.vercel.app/dashboard
- **API Health:** https://swift-route-liard.vercel.app/api/v1/health

---

## 🙏 Acknowledgments

- **OSRM** - Open Source Routing Machine for global routing
- **Supabase** - Backend infrastructure
- **Vercel** - Serverless deployment platform
- **UN SDG 11** - Inspiration for sustainable cities focus

---

**Built with ❤️ for sustainable urban logistics**

*Last Updated: November 17, 2025*
